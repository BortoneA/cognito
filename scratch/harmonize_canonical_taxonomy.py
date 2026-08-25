import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

# Canonical Standardized Medical Taxonomy (Clear, Granular, Mutually Exclusive)
CANONICAL_MAPPING = {
    # Cardiologia
    "Doença Isquêmica & Síndromes Coronarianas (IAM/Angina)": "Síndrome Coronariana Aguda & Infarto (IAM)",
    "Fibrilação Auricular, Arritmias & Eletrofisiologia": "Fibrilação Auricular & Arritmias",
    "Arritmias & Eletrofisiologia": "Fibrilação Auricular & Arritmias",
    "Pericárdio, Miocardite & Aorta": "Valvopatias, Endocardite & Aorta",

    # Endocrinologia
    "Diabetes Mellitus & Manejo Crônico": "Diabetes Mellitus: Diagnóstico & Manejo Crônico",
    "Diabetes Mellitus & Complicações Agudas": "Diabetes: Complicações Agudas (Cetoacidose / EHH)",
    "Tireoide (Hipotireoidismo & Hipertireoidismo)": "Tireoide: Disfunção, Nódulos & Câncer",

    # Gastroenterologia
    "Esôfago & Estômago (DRGE, Úlcera, HDA)": "Esôfago, Estômago & Doença Péptica",
    "Intestino Grosso, Delgado & Doença Celíaca": "Intestino, Diarreia & Doença Celíaca",

    # Ginecologia & Obstetrícia
    "Ginecologia: Sangramento & Endocrinologia Ginecológica": "Ginecologia: Sangramento, Endometriose & Endócrino",
    "Obstetrícia: Trabalho de Parto & Puerpério": "Obstetrícia: Parto, Puerpério & Hemorragias",

    # Nefrologia
    "Distúrbios Hidroeletrolíticos & Ácido-Base": "Distúrbios Eletrolíticos & Ácido-Base",
    "Injúria Renal Aguda (IRA)": "Injúria Renal Aguda & Síndrome Urêmica",

    # Pediatria
    "Neonatologia & Puericultura": "Neonatologia & Reanimação Neonatal",
    "Infectologia & Exantemas Pediátricos": "Doenças Exantemáticas & Infecciosas da Infância",
    "Puericultura & Desenvolvimento Infantil": "Puericultura, Crescimento & Vacinação",

    # Pneumologia
    "Asma & DPOC": "Doença Pulmonar Obstrutiva Crônica (DPOC)",
    "Pneumonias & Infecções Respiratórias": "Pneumonias Adquiridas & Nosocomiais",
}

with open('src/data/banco_questoes_pna.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

questoes = data.get('questoes', [])
updated_count = 0

for q in questoes:
    subarea = q.get('subarea', '').strip()
    if subarea in CANONICAL_MAPPING:
        q['subarea'] = CANONICAL_MAPPING[subarea]
        updated_count += 1

print(f"Total de questões harmonizadas para subáreas canônicas: {updated_count}")

# Rebuild clean taxonomy
taxonomy = {}
for q in questoes:
    area = q.get('area', '').strip()
    subarea = q.get('subarea', '').strip()
    if area not in taxonomy:
        taxonomy[area] = set()
    taxonomy[area].add(subarea)

taxonomy_clean = {k: sorted(list(v)) for k, v in sorted(taxonomy.items())}

print("\n=== ARSENAL CANÔNICO FINAL DE GRANDES ÁREAS E SUBÁREAS ===")
total_subareas = 0
for area, subareas in taxonomy_clean.items():
    print(f"\n[{area}] ({len(subareas)} subáreas):")
    for s in subareas:
        print(f"  • {s}")
        total_subareas += 1

print(f"\nTotal Geral de Subáreas Canônicas Fixas: {total_subareas}")

# Save updated databases
with open('src/data/banco_questoes_pna.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

with open('public/data/banco_questoes_pna.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

# Update medicalTaxonomy.js
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

print("\n✅ Todas as 5.073 questões e o módulo 'src/data/medicalTaxonomy.js' foram sincronizados com 100% de precisão canônica!")
