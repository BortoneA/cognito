import json
import re
import sys
import unicodedata

sys.stdout.reconfigure(encoding='utf-8')

def normalize(text):
    if not text:
        return ""
    nfkd = unicodedata.normalize('NFKD', str(text).lower())
    return "".join([c for c in nfkd if not unicodedata.combining(c)])

with open('src/data/banco_questoes_pna.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

questoes = data.get('questoes', [])
stress_keywords = [
    "pos-traumatico", "estresse pos", "tept", "transtorno de adaptacao", "transtorno de ajustamento",
    "somatizacao", "sintomas somaticos", "transtorno conversivo", "pseudocrise", "transtorno facticio",
    "munchausen", "ganho secundario", "reacao aguda ao estresse", "ansiedade de separacao"
]

stress_count = 0
for q in questoes:
    enunc = normalize(q.get('enunciado', ''))
    exp = normalize(q.get('explicacao', ''))
    theme = normalize(q.get('doenca_ou_conjunto_de_doencas', ''))
    
    if any(k in enunc or k in theme or k in exp for k in stress_keywords):
        # ensure not physical surgical trauma
        if not any(k in enunc for k in ["choque hipovolemico", "politraumatizado", "atls", "drenagem de torax", "fratura exposta"]):
            q['area'] = "Psiquiatria"
            q['subarea'] = "Transtornos de Estresse, TEPT & Somatização"
            stress_count += 1

print(f"Questoes adicionadas a 'Transtornos de Estresse, TEPT & Somatizacao': {stress_count}")

with open('src/data/banco_questoes_pna.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

with open('public/data/banco_questoes_pna.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

# Print final distribution of Psiquiatria
psych_subs = {}
for q in questoes:
    if q.get('area') == 'Psiquiatria':
        s = q.get('subarea')
        psych_subs[s] = psych_subs.get(s, 0) + 1

print("\n=== DISTRIBUIÇÃO FINAL DAS SUBÁREAS DA PSIQUIATRIA ===")
for s, c in sorted(psych_subs.items(), key=lambda x: -x[1]):
    print(f"• {s}: {c} questões")
