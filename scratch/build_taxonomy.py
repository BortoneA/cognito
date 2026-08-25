import json
import sys
from collections import defaultdict

sys.stdout.reconfigure(encoding='utf-8')

with open('src/data/banco_questoes_pna.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

taxonomy = defaultdict(set)
for q in data['questoes']:
    area = q.get('area', 'Clínica Médica Geral').strip()
    subarea = q.get('subarea', 'Geral').strip()
    if area and subarea:
        taxonomy[area].add(subarea)

taxonomy_clean = {}
print("=== ARSENAL OFICIAL DE GRANDES AREAS E SUBAREAS (5.073 QUESTOES) ===")
for area in sorted(taxonomy.keys()):
    subareas = sorted(list(taxonomy[area]))
    taxonomy_clean[area] = subareas
    print(f"\n[{area}] ({len(subareas)} subareas):")
    for s in subareas:
        print(f"  * {s}")

# Export directly to JS module
js_code = "/**\n * Arsenal Oficial de Áreas e Subáreas Médicas PNA (Taxonomia Fixa Imutável)\n */\n\n"
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

print("\nArquivo 'src/data/medicalTaxonomy.js' gerado com sucesso!")
