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

# Granular Psychiatry Subareas Definition
PSYCHIATRY_TAXONOMY = [
    ("Psiquiatria", "Transtornos do Humor (Depressão & Bipolaridade)", [
        "episodio depressivo maior", "depressao maior", "depressao unipolar", "transtorno afetivo bipolar",
        "episodio maniaco", "mania aguda", "hipomania", "distimia", "humor deprimido", "anedonia",
        "carbonato de litio", "estabilizador de humor", "antidepressivo isrs", "sertralina",
        "escitalopram", "fluoxetina", "paroxetina", "venlafaxina", "duloxetina", "bupropiona",
        "mirtazapina", "eletroconvulsoterapia", "ideacao suicida", "tentativa de suicidio",
        "risco de suicidio", "ciclagem rapida"
    ], ["isrs", "isrn", "ect", "tab"]),

    ("Psiquiatria", "Transtornos de Ansiedade, Pânico, Fobias & TOC", [
        "transtorno de ansiedade generalizada", "ataque de panico", "transtorno de panico",
        "agorafobia", "fobia social", "ansiedade social", "fobia especifica",
        "transtorno obsessivo-compulsivo", "obsessoes e compulsoes", "rituais compulsivos",
        "clomipramina", "ansiolitico benzodiazepina", "alprazolam", "diazepam", "lorazepam",
        "crise de ansiedade aguda", "ansiedade paroxistica"
    ], ["tag", "toc"]),

    ("Psiquiatria", "Transtornos Psicóticos & Esquizofrenia", [
        "esquizofrenia", "delirios persecutorios", "alucinacoes auditivas", "transtorno esquizoafetivo",
        "transtorno delirante", "surto psicotico", "sintomas negativos", "embotamento afetivo",
        "antipsicotico", "haloperidol", "risperidona", "olanzapina", "quetiapina", "clozapina",
        "aripiprazol", "sindrome neuroleptica maligna", "acatisia", "distonia aguda",
        "discinesia tardia", "antipsicotico atipico"
    ], ["snm"]),

    ("Psiquiatria", "Transtornos por Uso de Substâncias & Adições", [
        "dependencia de alcool", "etilismo cronico", "abstinencia alcoolica", "delirium tremens",
        "naltrexona", "acamprosato", "dissulfiram", "intoxicacao por opioides", "naloxona",
        "overdose de benzodiazepinicos", "flumazenil", "dependencia de cannabis",
        "intoxicacao por cocaina", "cessacao tabagica", "vareniclina", "sindrome de abstinencia"
    ], []),

    ("Psiquiatria", "Transtornos de Estresse, TEPT & Somatização", [
        "transtorno de estresse pos-traumatico", "estresse pos traumatico", "tept",
        "transtorno de estresse agudo", "transtorno de adaptacao", "transtorno somatoforme",
        "sintomas somaticos", "transtorno conversivo", "pseudocrise", "transtorno facticio",
        "sindrome de munchausen", "ganho secundario", "somatizacao"
    ], ["tept"]),

    ("Psiquiatria", "Transtornos Alimentares & da Personalidade", [
        "anorexia nervosa", "bulimia nervosa", "compulsao alimentar", "sinal de russell",
        "restricao alimentar severa", "sindrome de realimentacao", "transtorno de personalidade borderline",
        "personalidade antissocial", "personalidade histrionica", "personalidade narcisista",
        "personalidade esquizoide", "personalidade obsessivo-compulsiva", "automutilacao"
    ], ["imc"]),

    ("Psiquiatria", "Psiquiatria da Infância & Emergências Psiquiátricas", [
        "transtorno do deficit de atencao", "hiperatividade tdah", "metilfenidato",
        "transtorno do espectro autista", "autismo infantil", "agitacao psicomotora",
        "contencao mecanica", "contencao quimica de urgencia", "emergencia psiquiatrica"
    ], ["tdah", "tea"])
]

# Compile safe tokens
COMPILED_PSY = []
for area, subarea, phrases, acronyms in PSYCHIATRY_TAXONOMY:
    norm_phrases = [normalize(p) for p in phrases]
    norm_acronyms = [re.compile(r'\b' + re.escape(normalize(a)) + r'\b', re.IGNORECASE) for a in acronyms if len(a) > 2]
    COMPILED_PSY.append((area, subarea, norm_phrases, norm_acronyms))

with open('src/data/banco_questoes_pna.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

questoes = data.get('questoes', [])
reclassified_count = 0

for q in questoes:
    enunc = normalize(q.get('enunciado', ''))
    exp = normalize(q.get('explicacao', ''))
    theme = normalize(q.get('doenca_ou_conjunto_de_doencas', ''))
    alts = normalize(str(q.get('alternativas', '')))

    # Exclude primary non-psychiatric conditions that mention secondary depression or delirium
    if any(k in enunc for k in ["acidente vascular", "isquemia cerebral", "tromboembolismo", "apendicite", "eletrocardiograma", "gestante", "parto cesariana"]):
        # Check if purely psychiatric question vs medical with psychiatric mention
        is_strictly_psych = any(pk in enunc or pk in theme for pk in [
            "antidepressivo", "antipsicotico", "esquizofrenia", "delirios", "alucinacoes",
            "ataque de panico", "bipolar", "episodio maniaco", "anorexia nervosa", "bulimia",
            "ideacao suicida", "tentativa de suicidio", "abstinencia alcoolica", "delirium tremens"
        ])
        if not is_strictly_psych:
            continue

    best_match = None
    max_score = 0

    for area, subarea, phrases, acronyms in COMPILED_PSY:
        score = 0
        for p in phrases:
            if p in enunc:
                score += 15
            elif p in theme:
                score += 12
            elif p in exp:
                score += 5
            elif p in alts:
                score += 3

        for rx in acronyms:
            if rx.search(enunc):
                score += 10
            elif rx.search(theme):
                score += 8
            elif rx.search(exp):
                score += 4

        if score > max_score and score >= 12:
            max_score = score
            best_match = (area, subarea)

    if best_match:
        q['area'] = best_match[0]
        q['subarea'] = best_match[1]
        reclassified_count += 1

print(f"Total de questões identificadas e reclassificadas para Psiquiatria de Alta Precisão: {reclassified_count}")

# Rebuild taxonomy map
all_areas = {}
for q in questoes:
    a = q.get('area', '').strip()
    s = q.get('subarea', '').strip()
    if a not in all_areas:
        all_areas[a] = set()
    all_areas[a].add(s)

# Ensure all 7 psychiatry subareas are registered
if "Psiquiatria" in all_areas:
    for _, sub, _, _ in PSYCHIATRY_TAXONOMY:
        all_areas["Psiquiatria"].add(sub)

taxonomy_clean = {k: sorted(list(v)) for k, v in sorted(all_areas.items())}

print("\n=== SUBAREAS DA PSIQUIATRIA CADASTRADAS NO ARSENAL ===")
for sub in taxonomy_clean.get("Psiquiatria", []):
    count = sum(1 for q in questoes if q.get('area') == 'Psiquiatria' and q.get('subarea') == sub)
    print(f"  • {sub}: {count} questões")

# Save updated files
with open('src/data/banco_questoes_pna.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

with open('public/data/banco_questoes_pna.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

# Export medicalTaxonomy.js
js_code = "/**\n * Arsenal Oficial Canônico de Áreas e Subáreas Médicas PNA (Fixas e Imutáveis)\n */\n\n"
js_code += "export const MEDICAL_TAXONOMY = " + json.dumps(taxonomy_clean, ensure_ascii=False, indent=2) + ";\n\n"
js_code += """export const getAvailableAreas = () => Object.keys(MEDICAL_TAXONOMY);

export const getSubareasByArea = (area) => {
  if (!area || !MEDICAL_TAXONOMY[area]) {
    return [];
  }
  return MEDICAL_TAXONOMY[area];
};

export const getAllSubareas = () => {
  const all = new Set();
  Object.values(MEDICAL_TAXONOMY).forEach(subList => {
    subList.forEach(s => all.add(s));
  });
  return Array.from(all).sort();
};
"""

with open('src/data/medicalTaxonomy.js', 'w', encoding='utf-8') as f:
    f.write(js_code)

print("\n✅ Módulo 'src/data/medicalTaxonomy.js' atualizado com 7 subáreas canônicas para Psiquiatria!")
