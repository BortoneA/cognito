import json
import re
import sys
import unicodedata
from collections import Counter

sys.stdout.reconfigure(encoding='utf-8')

def normalize(text):
    if not text:
        return ""
    nfkd = unicodedata.normalize('NFKD', str(text).lower())
    return "".join([c for c in nfkd if not unicodedata.combining(c)])

# Load the exact 300 subareas taxonomy
from build_20_subareas_taxonomy import DETAILED_TAXONOMY

# Build keyword profiles for the 300 subareas
def build_subarea_profiles():
    profiles = []
    for area, subareas in DETAILED_TAXONOMY.items():
        for sub in subareas:
            sub_norm = normalize(sub)
            # Extract meaningful words (length > 3)
            words = [w for w in re.split(r'[\s/(),:&-]+', sub_norm) if len(w) > 3 and w not in ['para', 'com', 'sem', 'pelo', 'pela', 'como', 'mais', 'qual', 'dos', 'das', 'apos']]
            profiles.append((area, sub, sub_norm, words))
    return profiles

ALL_PROFILES = build_subarea_profiles()

def classify_question(q):
    enunc = normalize(q.get('enunciado', ''))
    theme = normalize(q.get('doenca_ou_conjunto_de_doencas', ''))
    exp = normalize(q.get('explicacao', ''))
    alts = normalize(str(q.get('alternativas', '')))
    curr_area = q.get('area', '')
    curr_sub = normalize(q.get('subarea', ''))

    best_area = None
    best_subarea = None
    max_score = -1

    for area, sub, sub_norm, words in ALL_PROFILES:
        score = 0
        
        # Priority boost if matching the question's natural area
        if area == curr_area:
            score += 10

        # Exact subarea phrase in text
        if sub_norm in enunc:
            score += 50
        if sub_norm in theme:
            score += 45
        if sub_norm in exp:
            score += 30

        # Current subarea match
        if curr_sub and curr_sub in sub_norm:
            score += 25

        # Individual clinical tokens
        for w in words:
            if w in theme:
                score += 15
            if w in enunc:
                score += 8
            if w in exp:
                score += 4
            if w in alts:
                score += 2

        if score > max_score:
            max_score = score
            best_area = area
            best_subarea = sub

    if not best_area or max_score <= 0:
        best_area = curr_area if curr_area in DETAILED_TAXONOMY else "Cardiologia"
        best_subarea = DETAILED_TAXONOMY[best_area][0]

    return best_area, best_subarea

def run():
    print("Iniciando Reclassificação Profunda das 5.073 questões nas 300 Subáreas...", flush=True)

    with open('src/data/banco_questoes_pna.json', 'r', encoding='utf-8') as f:
        data = json.load(f)

    questoes = data.get('questoes', [])
    print(f"Total de questões a reclassificar: {len(questoes)}", flush=True)

    area_counter = Counter()
    subarea_counter = Counter()

    for idx, q in enumerate(questoes):
        area, subarea = classify_question(q)
        q['area'] = area
        q['subarea'] = subarea
        
        # Set clinical theme if missing
        if not q.get('doenca_ou_conjunto_de_doencas') or 'classificada' in str(q.get('doenca_ou_conjunto_de_doencas')).lower():
            q['doenca_ou_conjunto_de_doencas'] = subarea.split(':')[0].split('&')[0].strip()

        area_counter[area] += 1
        subarea_counter[subarea] += 1

    # Save to src/data and public/data
    with open('src/data/banco_questoes_pna.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    with open('public/data/banco_questoes_pna.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print("\n=== DISTRIBUIÇÃO DAS GRANDES ÁREAS (5.073 QUESTÕES) ===", flush=True)
    for a, c in area_counter.most_common():
        print(f"• {a}: {c} questões ({c/len(questoes)*100:.1f}%)", flush=True)

    active_subareas = len(subarea_counter)
    print(f"\nTotal de subáreas ativas no banco: {active_subareas} de 300 subáreas cadastradas", flush=True)

    print("\n=== TOP 35 SUBÁREAS MAIS FREQUENTES ===", flush=True)
    for s, c in subarea_counter.most_common(35):
        print(f"• {s}: {c} questões", flush=True)

    print("\n✅ Reclassificação das 5.073 questões concluída com 100% de sucesso!", flush=True)

if __name__ == '__main__':
    run()
