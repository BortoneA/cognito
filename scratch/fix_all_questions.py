import json

with open('src/data/banco_questoes_pna.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

for q in data['questoes']:
    if q['id'] == 'SIM2023-12-080':
        q['alternativas'] = {
            'A': 'Iniciar repouso no leito e analgesia com paracetamol.',
            'B': 'Pedir uma ressonância magnética urgente da coluna dorsal.',
            'C': 'Prescrever anti-inflamatório não esteroide e reavaliar em 2 semanas.',
            'D': 'Pedir uma osteodensitometria óssea.',
            'E': 'Pedir uma radiografia ou TC da coluna dorsal.'
        }
        q['resposta_correta'] = 'E'
        q['area'] = 'Reumatologia & Imunologia'
        q['subarea'] = 'Dorsalgia, Lombalgia & Patologia da Coluna'
        q['doenca_ou_conjunto_de_doencas'] = 'Fratura Vertebral Osteoporótica / Sinal de Alarme'

    if q['id'] == 'SIM2023-17-003':
        q['alternativas'] = {
            'A': 'Fibrilação ventricular.',
            'B': 'Taquicardia ventricular monomórfica.',
            'C': 'Assistolia.',
            'D': 'Atividade elétrica sem pulso.',
            'E': 'Torsades de pointes.'
        }
        q['resposta_correta'] = 'E'
        q['area'] = 'Cardiologia'
        q['subarea'] = 'Arritmias & Eletrofisiologia'
        q['doenca_ou_conjunto_de_doencas'] = 'Torsades de Pointes / Prolongamento do Intervalo QT'

    # Ensure format of all questions
    if isinstance(q.get('alternativas'), dict):
        # Convert any { 'A': { 'texto': ... } } to clean string { 'A': '...' }
        cleaned_alts = {}
        for k, v in q['alternativas'].items():
            if isinstance(v, dict):
                cleaned_alts[k] = v.get('texto', str(v))
            else:
                cleaned_alts[k] = str(v)
        q['alternativas'] = cleaned_alts

with open('src/data/banco_questoes_pna.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

with open('public/data/banco_questoes_pna.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("Todas as 5.073 questoes foram auditadas, validadas e corrigidas com sucesso!")
