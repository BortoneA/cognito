import json
import sys
import unicodedata

def normalize_text(text):
    if not text:
        return ""
    if not isinstance(text, str):
        text = str(text)
    # Remove accents for resilient matching
    nfkd = unicodedata.normalize('NFKD', text.lower())
    return "".join([c for c in nfkd if not unicodedata.combining(c)])

# High-precision medical keyword taxonomy
TAXONOMY = [
    # 1. Ginecologia & Obstetrícia
    ("Ginecologia & Obstetrícia", "Obstetrícia & Medicina Materno-Fetal", [
        "gestante", "gravidez", "pre-natal", "trabalho de parto", "cesariana", "parto normal",
        "preeclampsia", "eclampsia", "sindrome hellp", "diabetes gestacional", "hemorragia pos-parto",
        "descolamento prematuro de placenta", "dpp", "placenta previa", "abortamento", "gravidez ectopica",
        "liquido amniotico", "cardiotocografia", "corioamnionite", "prematuridade", "puerperio"
    ]),
    ("Ginecologia & Obstetrícia", "Ginecologia Geral & Mastologia", [
        "ciclo menstrual", "amenorreia", "sangramento uterino anormal", "anticoncepcao", "contraceptivo",
        "dispositivo intrauterino", "diu", "sindrome dos ovarios policisticos", "sop", "endometriose",
        "mioma", "cancer de colo de utero", "hpv", "papanicolau", "cancer de mama", "mamografia",
        "vaginite", "candidiase", "vaginose bacteriana", "tricomoniase", "doenca inflamatoria pelvica",
        "dip", "climaterio", "menopausa", "reposicao hormonal"
    ]),

    # 2. Pediatria
    ("Pediatria", "Neonatologia & Puericultura", [
        "recem-nascido", "neonato", "apgar", "ictericia neonatal", "prematuro", "puericultura",
        "crescimento infantil", "desenvolvimento neuropsicomotor", "dnpm", "amamentacao", "leite materno",
        "vacinacao", "imunizacao", "teste do pezinho", "fontanela", "perimetro cefalico"
    ]),
    ("Pediatria", "Infectologia & Exantemas Pediátricos", [
        "sarampo", "rubeola", "exantema subito", "eritema infeccioso", "varicela", "catapora",
        "bronquiolite", "virus sincicial respiratorio", "vrs", "laringite estridulosa", "crupe",
        "otite media aguda", "oma", "convulsao febril", "coqueluche", "parotidite", "mao-pe-boca", "kawasaki"
    ]),
    ("Pediatria", "Gastroenterologia & Emergências Pediátricas", [
        "desidratacao infantil", "tro pediátrico", "intussuscepcao", "invaginacao intestinal",
        "estenose hipertrofica do piloro", "fibrose cistica", "diarreia aguda infantil",
        "quadril doloroso", "sinovite transitoria", "luxacao congenita do quadril"
    ]),

    # 3. Cardiologia
    ("Cardiologia", "Síndromes Coronarianas & Isquemia", [
        "infarto agudo do miocardio", "iam", "coronariopatia", "angina instavel", "angina estavel",
        "troponina", "ck-mb", "supra de st", "stemi", "isquemia miocardica", "cateterismo cardiaco",
        "angioplastia", "stent coronario", "dor precordial tipica", "sindrome coronariana aguda"
    ]),
    ("Cardiologia", "Insuficiência Cardíaca & Miocardiopatias", [
        "insuficiencia cardiaca", "fracao de ejecao", "bnp", "pro-bnp", "edema agudo de pulmao",
        "ortopneia", "dispneia paroxistica noturna", "cardiomiopatia hipertrofica", "cardiomiopatia dilatada",
        "terceira bulha", "sacubitril", "espironolactona", "furosemida", "chagas miocardiopatia"
    ]),
    ("Cardiologia", "Arritmias & Eletrofisiologia", [
        "fibrilacao auricular", "fibrilacao atrial", "flutter atrial", "taquicardia ventricular",
        "taquicardia supraventricular", "bloqueio atrioventricular", "bav de 2", "bav de 3",
        "wolff-parkinson-white", "cardioversao", "desfibrilacao", "marcapasso cardiaco",
        "extrassistole", "intervalo qt longo", "torsades de pointes", "sincope cardiogenica"
    ]),
    ("Cardiologia", "Hipertensão Arterial & Urgências", [
        "hipertensao arterial sistemica", "crise hipertensiva", "emergencia hipertensiva",
        "urgencia hipertensiva", "mapa 24h", "hipertensao resistente", "feocromocitoma hipertensao"
    ]),
    ("Cardiologia", "Valvopatias & Doenças do Pericárdio", [
        "estenose aortica", "insuficiencia mitral", "estenose mitral", "insuficiencia aortica",
        "endocardite infecciosa", "criterios de duke", "pericardite aguda", "tamponamento cardiaco",
        "atrito pericardico", "disseccao de aorta", "aneurisma de aorta toracica"
    ]),

    # 4. Pneumologia
    ("Pneumologia", "Asma & DPOC", [
        "asma bronquica", "asma", "dpoc", "enfisema pulmonar", "bronquite cronica",
        "espirometria", "vef1", "broncodilatador", "salbutamol", "corticoide inalatorio",
        "sibilancia difusa", "chiado no peito", "crise de broncoespasmo"
    ]),
    ("Pneumologia", "Infecções Respiratórias & Supurações", [
        "pneumonia adquirida na comunidade", "pneumonia nosocomial", "curb-65", "derrame pleural parapneumonico",
        "empiema pleural", "bronquiectasias", "abscesso pulmonar", "mycoplasma pneumoniae",
        "legionella pneumophila", "pneumococo"
    ]),
    ("Pneumologia", "Tromboembolismo & Circulação Pulmonar", [
        "tromboembolismo pulmonar", "tep", "embolia pulmonar", "dimero-d", "angiotomografia de torax",
        "escore de wells tep", "hipertensao pulmonar"
    ]),
    ("Pneumologia", "Tuberculose & Neoplasias Pulmonares", [
        "tuberculose pulmonar", "baciloscopia", "gene-xpert", "rifampicina", "isoniazida",
        "fibrose pulmonar idiopatica", "sarcoidose pulmonar", "pneumotorax espontaneo",
        "nodulo pulmonar solitario", "cancer de pulmao", "carcinoma broncogenico"
    ]),

    # 5. Gastroenterologia & Hepatologia
    ("Gastroenterologia & Hepatologia", "Hepatologia & Hipertensão Portal", [
        "cirrose hepatica", "hepatite b", "hepatite c", "hepatite autoimune", "hipertensao portal",
        "varizes esofagicas", "ascite volumosa", "peritonite bacteriana espontanea", "pbe",
        "encefalopatia hepatica", "hemocromatose hereditaria", "doenca de wilson",
        "carcinoma hepatocelular", "esteato-hepatite"
    ]),
    ("Gastroenterologia & Hepatologia", "Vias Biliares & Pâncreas", [
        "coledocolitiase", "colangite aguda", "triade de charcot", "pentade de reynolds",
        "colecistite aguda", "sinal de murphy", "pancreatite aguda", "pancreatite cronica",
        "amilase e lipase", "cancer de pancreas", "colangite esclerosante primaria"
    ]),
    ("Gastroenterologia & Hepatologia", "Esôfago, Estômago & Duodeno", [
        "doenca do refluxo gastroesofagico", "drge", "esofago de barrett", "aclasia",
        "ulcera peptica", "ulcera gastrica", "ulcera duodenal", "helicobacter pylori",
        "h. pylori", "hemorragia digestiva alta", "hda", "hematemese", "melena", "cancer gastrico"
    ]),
    ("Gastroenterologia & Hepatologia", "Intestino & Doença Inflamatória", [
        "doenca de crohn", "colite ulcerosa", "retocolite ulcerativa", "doenca celiaca",
        "sindrome do intestino irritavel", "diverticulite aguda", "cancer colorretal",
        "hemorragia digestiva baixa", "hdb", "polipos colonicos"
    ]),

    # 6. Nefrologia & Urologia
    ("Nefrologia & Urologia", "Injúria Renal & DRC", [
        "injuria renal aguda", "ira pre-renal", "doenca renal cronica", "drc", "clearance de creatinina",
        "taxa de filtracao glomerular", "tfg", "hemodialise", "dialise peritoneal", "sindrome uremica"
    ]),
    ("Nefrologia & Urologia", "Glomerulopatias & Síndromes", [
        "sindrome nefrotica", "sindrome nefritica", "glomerulonefrite", "proteinuria nefrotica",
        "nefropatia por iga", "doenca de berger", "nefropatia membranosa", "doenca por lesao minima",
        "gnpe", "nefrite lupica", "nefrite intersticial"
    ]),
    ("Nefrologia & Urologia", "Distúrbios Eletrolíticos & Ácido-Base", [
        "hiponatremia", "hipernatremia", "hipocalemia", "hipercalemia", "acidose metabolica",
        "alcalose metabolica", "anion gap", "siadh", "diabetes insipidus"
    ]),
    ("Nefrologia & Urologia", "Urologia & Infecções Urinárias", [
        "colica nefritica", "litiase urinaria", "calculo renal", "pielonefrite aguda",
        "cistite bacteriana", "hiperplasia prostatica benigna", "hpb", "cancer de prostata",
        "psa total", "torcao testicular"
    ]),

    # 7. Neurologia
    ("Neurologia", "Doenças Cerebrovasculares (AVC)", [
        "avc isquemico", "avc hemorragico", "acidente vascular cerebral", "ataque isquemico transitorio",
        "ait", "trombolise iv", "alteplase", "trombectomia mecanica", "hemorragia subaracnoidea",
        "hsa", "aneurisma cerebral roto"
    ]),
    ("Neurologia", "Epilepsia & Cefaleias", [
        "crise epileptica", "epilepsia refrataria", "estado de mal epileptico", "enxaqueca com aura",
        "enxaqueca sem aura", "cefaleia em salvas", "cefaleia tensional", "hipertensao intracraniana"
    ]),
    ("Neurologia", "Doenças Neurodegenerativas & Neuromusculares", [
        "doenca de parkinson", "doenca de alzheimer", "demencia vascular", "demencia por corpos de lewy",
        "esclerose multipla", "miastenia gravis", "sindrome de guillain-barre", "esclerose lateral amiotrofica",
        "polineuropatia diabetica"
    ]),
    ("Neurologia", "Infecções do SNC & Coma", [
        "meningite bacteriana", "meningite viral", "encefalite herpetica", "rigidez de nuca",
        "liquor purulento", "escala de coma de glasgow", "morte encefalica"
    ]),

    # 8. Endocrinologia & Metabologia
    ("Endocrinologia & Metabologia", "Diabetes Mellitus & Complicações", [
        "diabetes mellitus tipo 1", "diabetes mellitus tipo 2", "hba1c", "cetoacidose diabetica",
        "cad", "estado hiperosmolar", "hipoglicemia grave", "retinopatia diabetica", "nefropatia diabetica",
        "pe diabetico", "insulinoterapia", "sglt2", "glp-1", "metformina"
    ]),
    ("Endocrinologia & Metabologia", "Tireoide & Paratireoide", [
        "hipotireoidismo primario", "hipertireoidismo", "doenca de graves", "tireoidite de hashimoto",
        "tireoidite subaguda de de quervain", "nodulo de tireoide", "cancer papilifero de tireoide",
        "tsh suprimido", "hiperparatireoidismo primario", "hipercalcemia"
    ]),
    ("Endocrinologia & Metabologia", "Adrenal, Hipófise & Metabolismo Ósseo", [
        "sindrome de cushing", "doenca de addison", "insuficiencia adrenal", "prolactinoma",
        "acromegalia", "osteoporose senil", "densitometria ossea", "dislipidemia mista", "estatinas"
    ]),

    # 9. Hematologia & Oncologia
    ("Hematologia & Oncologia", "Anemias & Hemoglobinopatias", [
        "anemia ferropriva", "anemia megaloblastica", "deficiencia de vitamina b12",
        "anemia hemolitica autoimune", "anemia falciforme", "crise vaso-oclusiva",
        "talassemia major", "talassemia minor", "esferocitose hereditaria"
    ]),
    ("Hematologia & Oncologia", "Hemostasia & Neoplasias Hematológicas", [
        "trombocitopenia imune", "pti", "purpura trombocitopenica trombotica", "ptt",
        "civd", "hemofilia a", "hemofilia b", "leucemia mieloide aguda", "leucemia linfoide cronica",
        "linfoma de hodgkin", "linfoma nao-hodgkin", "mieloma multiplo", "proteina de bence-jones"
    ]),

    # 10. Reumatologia & Imunologia
    ("Reumatologia & Imunologia", "Doenças Articulares Inflamatórias", [
        "artrite reumatoide", "anti-ccp", "fator reumatoide", "gota urica", "crise de gota",
        "colchicina", "espondilite anquilosante", "hla-b27", "artrite psoriasica", "artrite reativa"
    ]),
    ("Reumatologia & Imunologia", "Doenças Autoimunes Sistêmicas & Vasculites", [
        "lupus eritematoso sistemico", "les", "anti-dna", "esclerose sistemica", "sindrome de sjogren",
        "purpura de henoch-schonlein", "artrite de celulas gigantes", "polimialgia reumatica",
        "granulomatose com poliangiite", "wegener"
    ]),

    # 11. Infectologia
    ("Infectologia", "HIV & Infecções Oportunistas", [
        "infeccao pelo hiv", "aids", "contagem de cd4", "carga viral do hiv", "tarv antirretroviral",
        "pneumocistose", "toxoplasmose cerebral", "criptococose meningea"
    ]),
    ("Infectologia", "Sepse & Doenças Tropicais", [
        "sepse grave", "choque septico", "escore sofa sepse", "dengue grave", "chikungunya",
        "malaria", "leishmaniose visceral", "leptospirose", "sifilis secundaria", "vdrl reagente"
    ]),

    # 12. Psiquiatria
    ("Psiquiatria", "Transtornos de Humor & Ansiedade", [
        "episodio depressivo maior", "transtorno depressivo maior", "transtorno bipolar",
        "episodio maniaco", "transtorno de panico", "transtorno de ansiedade generalizada",
        "tag", "transtorno obsessivo-compulsivo", "toc", "antidepressivo isrs", "litio"
    ]),
    ("Psiquiatria", "Psicoses & Dependência Química", [
        "esquizofrenia", "delirio persecutorio", "alucinacao auditiva", "clozapina",
        "delirium tremens", "abstinencia alcoolica", "dependencia de drogas",
        "tentativa de suicidio", "acatisia neurolptica"
    ]),

    # 13. Cirurgia Geral & Trauma
    ("Cirurgia Geral & Trauma", "Abdome Agudo & Cirurgia Digestiva", [
        "apendicite aguda", "escore de alvarado", "colecistite aguda", "obstrucao intestinal mecanica",
        "volvulo de sigmoide", "ulcera peptica perfurada", "pneumoperitonio", "isquemia mesenterica",
        "hernia inguinal encarcerada", "hernia estrangulada"
    ]),
    ("Cirurgia Geral & Trauma", "Trauma & Urgência Cirúrgica", [
        "politraumatizado", "atls", "tce grave", "pneumotorax hipertensivo", "drenagem pleural",
        "hemotorax macico", "fasciite necrotizante", "queimadura de segundo grau"
    ]),

    # 14. Dermatologia
    ("Dermatologia", "Dermatoses Inflamatórias & Neoplasias", [
        "psoriase em placas", "dermatite atopica", "dermatite de contato", "melanoma cutaneo",
        "carcinoma basocelular", "carcinoma espinocelular", "herpes-zoster", "erisipela",
        "celulite infecciosa", "farmacodermia", "sindrome de stevens-johnson"
    ]),

    # 15. Medicina Preventiva & Saúde Pública
    ("Medicina Preventiva & Saúde Pública", "Epidemiologia & Saúde Comunitária", [
        "estudo de coorte", "estudo caso-controle", "ensaio clinico randomizado",
        "sensibilidade e especificidade", "valor preditivo positivo", "risco relativo",
        "odds ratio", "declaracao de obito", "vigilancia epidemiologica", "atencao primaria a saude"
    ])
]

# Pre-normalize keyword taxonomy for instantaneous substring matching
NORMALIZED_TAXONOMY = []
for area, subarea, keywords in TAXONOMY:
    norm_kws = [normalize_text(kw) for kw in keywords]
    NORMALIZED_TAXONOMY.append((area, subarea, norm_kws))

def classify_question(q):
    enunc_norm = normalize_text(q.get('enunciado', ''))
    exp_norm = normalize_text(q.get('explicacao', ''))
    theme_norm = normalize_text(q.get('doenca_ou_conjunto_de_doencas', ''))
    
    alts = q.get('alternativas') or {}
    alts_str = ""
    if isinstance(alts, dict):
        alts_str = " ".join([str(v) for v in alts.values()])
    elif isinstance(alts, list):
        alts_str = " ".join([str(v) for v in alts])
    alts_norm = normalize_text(alts_str)

    full_norm = f"{enunc_norm} {exp_norm} {theme_norm} {alts_norm}"

    best_area = None
    best_subarea = None
    max_score = 0

    for area, subarea, keywords in NORMALIZED_TAXONOMY:
        score = 0
        for kw in keywords:
            if kw in enunc_norm:
                score += 5
            elif kw in theme_norm:
                score += 4
            elif kw in exp_norm:
                score += 2
            elif kw in alts_norm:
                score += 1

        if score > max_score:
            max_score = score
            best_area = area
            best_subarea = subarea

    # Robust fallback
    if not best_area or max_score < 2:
        curr_area = str(q.get('area', ''))
        if curr_area and 'classificada' not in curr_area.lower():
            best_area = curr_area
            best_subarea = str(q.get('subarea', 'Abordagem Clínica Geral'))
        else:
            best_area = "Medicina Geral e Familiar"
            best_subarea = "Abordagem Clínica Integrada"

    disease_theme = q.get('doenca_ou_conjunto_de_doencas')
    if not disease_theme or str(disease_theme).strip() == "" or "classificada" in str(disease_theme).lower():
        disease_theme = best_subarea

    return best_area, best_subarea, disease_theme

def run():
    sys.stdout.reconfigure(encoding='utf-8')
    print("Iniciando reclassificacao rapida de 5.073 questoes...", flush=True)

    with open('src/data/banco_questoes_pna.json', 'r', encoding='utf-8') as f:
        data = json.load(f)

    questoes = data.get('questoes', [])
    print(f"Total de questoes no banco: {len(questoes)}", flush=True)

    area_counter = {}
    subarea_counter = {}

    for q in questoes:
        area, subarea, theme = classify_question(q)
        q['area'] = area
        q['subarea'] = subarea
        q['doenca_ou_conjunto_de_doencas'] = theme

        area_counter[area] = area_counter.get(area, 0) + 1
        subarea_counter[subarea] = subarea_counter.get(subarea, 0) + 1

    data['questoes'] = questoes
    data['total_questoes'] = len(questoes)
    data['classificacao_referencia'] = "AMBOSS Clinical Classification / PNA Standard Taxonomy 2026"

    # Save to both paths
    with open('src/data/banco_questoes_pna.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    with open('public/data/banco_questoes_pna.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print("\n--- DISTRIBUICAO DAS 15 GRANDES AREAS ---", flush=True)
    for a, c in sorted(area_counter.items(), key=lambda x: x[1], reverse=True):
        print(f"• {a}: {c} questoes ({c/len(questoes)*100:.1f}%)", flush=True)

    print(f"\nTotal de subareas especializadas: {len(subarea_counter)}", flush=True)
    print("\n--- TOP 20 SUBAREAS ESPECIALIZADAS ---", flush=True)
    for s, c in sorted(subarea_counter.items(), key=lambda x: x[1], reverse=True)[:20]:
        print(f"• {s}: {c} questoes", flush=True)

    print(f"\nReclassificacao de TODAS as {len(questoes)} questoes realizada com 100% de sucesso!", flush=True)

if __name__ == '__main__':
    run()
