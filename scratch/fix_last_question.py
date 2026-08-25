import json

with open('src/data/banco_questoes_pna.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

for q in data['questoes']:
    if q['id'] == 'SIM2023-12-126':
        q['alternativas'] = {
            'A': 'Realizar ecografia reno-vesical e estudo analítico regular.',
            'B': 'Realizar angio-ressonância cranioencefálica.',
            'C': 'Propor biópsia renal para confirmação diagnóstica.',
            'D': 'Realizar estudo genético direcionado ao gene PKHD1.',
            'E': 'Realizar estudo analítico regular e TC abdominal seriada para vigilância de carcinoma de células renais.'
        }
        q['resposta_correta'] = 'A'
        q['area'] = 'Nefrologia & Urologia'
        q['subarea'] = 'Doença Renal Crônica & Substituição Renal'
        q['doenca_ou_conjunto_de_doencas'] = 'Doença Poliquística Renal Autossómica Dominante (DPQAD)'

with open('src/data/banco_questoes_pna.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

with open('public/data/banco_questoes_pna.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("Questao SIM2023-12-126 completada!")
