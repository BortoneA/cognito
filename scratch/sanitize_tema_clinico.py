import json
import unicodedata
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

def normalize(text):
    if not text:
        return ""
    nfkd = unicodedata.normalize('NFKD', str(text).lower())
    return "".join([c for c in nfkd if not unicodedata.combining(c)]).strip()

def sanitize():
    print("Iniciando varredura e sanitização de 'Tema Clínico' em todas as 5.073 questões...", flush=True)

    with open('src/data/banco_questoes_pna.json', 'r', encoding='utf-8') as f:
        data = json.load(f)

    questoes = data.get('questoes', [])
    sanitized_count = 0

    for q in questoes:
        theme = q.get('doenca_ou_conjunto_de_doencas', '')
        theme_norm = normalize(theme)
        alts = q.get('alternativas', {})
        subarea = q.get('subarea', '')
        area = q.get('area', '')

        is_spoiler = False
        
        # Check against all alternatives
        for k, v in alts.items():
            alt_text = v if isinstance(v, str) else v.get('texto', '')
            alt_norm = normalize(alt_text)

            if not alt_norm or not theme_norm:
                continue

            # Direct overlap checks
            if len(theme_norm) >= 3 and len(alt_norm) >= 3:
                if theme_norm in alt_norm or alt_norm in theme_norm:
                    is_spoiler = True
                    break
                
                # Check major token overlaps
                theme_tokens = set([t for t in re.split(r'[\s/(),:&-]+', theme_norm) if len(t) > 3 and t not in ['para', 'com', 'sem', 'como', 'mais', 'pelo', 'pela', 'tipo', 'grau', 'fase']])
                alt_tokens = set([t for t in re.split(r'[\s/(),:&-]+', alt_norm) if len(t) > 3 and t not in ['para', 'com', 'sem', 'como', 'mais', 'pelo', 'pela', 'tipo', 'grau', 'fase']])
                
                if theme_tokens and alt_tokens:
                    overlap = theme_tokens.intersection(alt_tokens)
                    if len(overlap) >= 2 or (len(overlap) == 1 and len(theme_tokens) <= 2):
                        is_spoiler = True
                        break

        if is_spoiler or not theme or 'classificad' in theme_norm:
            # Replace with a safe, non-spoiler clinical domain derived from the canonical subarea
            safe_theme = subarea.split(':')[0].split('&')[0].strip() if subarea else f"Conduta em {area}"
            
            # Double check that safe_theme doesn't collide with alternatives
            safe_norm = normalize(safe_theme)
            safe_spoiler = False
            for k, v in alts.items():
                alt_text = v if isinstance(v, str) else v.get('texto', '')
                alt_norm = normalize(alt_text)
                if safe_norm and alt_norm and (safe_norm in alt_norm or alt_norm in safe_norm):
                    safe_spoiler = True
                    break
            
            if safe_spoiler:
                q['doenca_ou_conjunto_de_doencas'] = f"Caso Clínico de {area}"
            else:
                q['doenca_ou_conjunto_de_doencas'] = safe_theme

            sanitized_count += 1

    # Save to both locations
    with open('src/data/banco_questoes_pna.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    with open('public/data/banco_questoes_pna.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"✅ Varredura concluída com sucesso! Total de {sanitized_count} menções de 'Tema Clínico' neutralizadas e sanitizadas.", flush=True)

if __name__ == '__main__':
    sanitize()
