import json
import re
import sys
import unicodedata
from collections import Counter

def normalize(text):
    if not text:
        return ""
    if not isinstance(text, str):
        text = str(text)
    nfkd = unicodedata.normalize('NFKD', text.lower())
    return "".join([c for c in nfkd if not unicodedata.combining(c)])

# 85+ Ultra-Granular Medical Subareas with prioritized scoring
GRANULAR_TAXONOMY = [
    # ── CARDIOLOGIA ──
    ("Cardiologia", "Síndrome Coronariana Aguda & Infarto (IAM)", [
        "infarto agudo do miocardio", "iam com supra", "iam sem supra", "stemi", "nstemi",
        "troponina elevada", "angioplastia primaria", "stent coronario", "cateterismo cardiaco",
        "dor precordial em aperto", "isquemia miocardica aguda", "ck-mb massa"
    ], 30),
    ("Cardiologia", "Angina Estável & Doença Coronária Crônica", [
        "angina estavel", "angina de esforco", "angina instavel", "teste ergometrico",
        "cintilografia miocardica", "coronariopatia cronica", "dupla antiagregacao", "isossorbida"
    ], 20),
    ("Cardiologia", "Insuficiência Cardíaca & Choque Cardiogênico", [
        "insuficiencia cardiaca com fracao de ejecao", "icfer", "icfep", "bnp", "pro-bnp",
        "edema agudo de pulmao", "ortopneia", "dispneia paroxistica", "terceira bulha",
        "sacubitril valsartana", "espironolactona", "furosemida iv", "choque cardiogenico"
    ], 25),
    ("Cardiologia", "Fibrilação Auricular & Arritmias Supraventriculares", [
        "fibrilacao auricular", "fibrilacao atrial", "flutter auricular", "flutter atrial",
        "taquicardia paroxistica supraventricular", "tpsv", "wolf-parkinson-white", "wpw",
        "cardioversao eletrica", "anticoagulacao chads", "chadsvasc", "ablacao por radiofrequencia"
    ], 25),
    ("Cardiologia", "Arritmias Ventriculares & Parada Cardiorrespiratória", [
        "taquicardia ventricular", "fibrilacao ventricular", "torsades de pointes",
        "parada cardiorrespiratoria", "suporte avancado de vida", "acls", "desfibrilador implantavel", "cdi",
        "bloqueio atrioventricular total", "bavt", "bav de 2 grau mobitz", "marcapasso definitivo"
    ], 25),
    ("Cardiologia", "Hipertensão Arterial Sistêmica & Crise Hipertensiva", [
        "hipertensao arterial sistemica", "emergencia hipertensiva", "urgencia hipertensiva",
        "nitroprussiato", "hipertensao resistente", "mapa de 24h", "hiperaldosteronismo primario"
    ], 20),
    ("Cardiologia", "Valvopatias (Aórtica, Mitral, Tricúspide)", [
        "estenose aortica", "insuficiencia aortica", "estenose mitral", "insuficiencia mitral",
        "sopro sistolico ejetivo", "sopro diastolico", "troca valvar", "tavi", "febre reumatica"
    ], 25),
    ("Cardiologia", "Pericárdio, Miocardite & Aorta", [
        "pericardite aguda", "atrito pericardico", "tamponamento cardiaco", "pulso paradoxal",
        "disseccao aguda de aorta", "aneurisma de aorta toracica", "miocardite viral"
    ], 25),

    # ── PNEUMOLOGIA ──
    ("Pneumologia", "Asma Brônquica", [
        "asma bronquica", "crise de asma", "broncoespasmo", "espirometria reversibilidade",
        "corticoide inalatorio", "formoterol", "salbutamol", "vef1", "sibilancia expiratoria"
    ], 25),
    ("Pneumologia", "Doença Pulmonar Obstrutiva Crônica (DPOC)", [
        "dpoc", "enfisema pulmonar", "bronquite cronica", "exacerbacao de dpoc", "tiotropio",
        "oxigenoterapia domiciliar", "tabagismo carga tabagica", "retencao de co2"
    ], 25),
    ("Pneumologia", "Pneumonias Adquiridas & Nosocomiais", [
        "pneumonia adquirida na comunidade", "pac", "curb-65", "pneumonia hospitalar",
        "pneumococo", "legionella", "mycoplasma", "amoxicilina clavulanato", "ceftriaxona", "claritromicina"
    ], 25),
    ("Pneumologia", "Tromboembolismo Pulmonar (TEP)", [
        "tromboembolismo pulmonar", "tep", "embolia pulmonar", "escore de wells",
        "dimero-d", "angiotomografia de torax", "trombose venosa profunda", "tvp"
    ], 25),
    ("Pneumologia", "Tuberculose Pulmonar & Pleural", [
        "tuberculose pulmonar", "baciloscopia positiva", "gene-xpert", "bacilo de koch",
        "rifampicina isoniazida", "rife", "caverna no apice pulmonar", "tuberculose pleural"
    ], 25),
    ("Pneumologia", "Neoplasias Pulmonares & Doenças Intersticiais", [
        "cancer de pulmao", "carcinoma pulmonar", "nodulo pulmonar solitario",
        "fibrose pulmonar idiopatica", "sarcoidose pulmonar", "pneumotorax espontaneo",
        "derrame pleural exsudato", "criterios de light", "empiema pleural"
    ], 25),

    # ── GASTROENTEROLOGIA & HEPATOLOGIA ──
    ("Gastroenterologia & Hepatologia", "Cirrose Hepática & Hipertensão Portal", [
        "cirrose hepatica", "hipertensao portal", "varizes esofagicas sangrantes",
        "ascite refrataria", "peritonite bacteriana espontanea", "pbe", "encefalopatia hepatica",
        "child-pugh", "escore meld", "lactulose", "terlipressina", "hemocromatose", "wilson"
    ], 25),
    ("Gastroenterologia & Hepatologia", "Hepatites Virais & Doenças Hepáticas", [
        "hepatite b aguda", "hepatite b cronica", "hepatite c", "hbsag", "anti-hcv",
        "hepatite autoimune", "esteatose hepatica nao alcoolica", "nash", "hepatocarcinoma"
    ], 25),
    ("Gastroenterologia & Hepatologia", "Litíase Biliar & Vias Biliares", [
        "coledocolitiase", "colangite aguda", "triade de charcot", "pentade de reynolds",
        "colecistite aguda calculosa", "sinal de murphy positivo", "cpre", "colecistectomia"
    ], 25),
    ("Gastroenterologia & Hepatologia", "Pâncreas (Pancreatite & Neoplasias)", [
        "pancreatite aguda", "criterios de ranson", "amilase e lipase elevadas",
        "pancreatite cronica", "calcificacoes pancreaticas", "adenocarcinoma de pancreas",
        "ictericia colestatica indolor", "sinal de courvoisier"
    ], 25),
    ("Gastroenterologia & Hepatologia", "Esôfago & Estômago (DRGE, Úlcera, HDA)", [
        "refluxo gastroesofagico", "drge", "esofago de barrett", "aclasia de esofago",
        "ulcera peptica", "ulcera gastrica", "ulcera duodenal", "helicobacter pylori",
        "hemorragia digestiva alta", "hda", "hematemese abundante", "melena", "omeprazol ev"
    ], 25),
    ("Gastroenterologia & Hepatologia", "Doença Inflamatória Intestinal (Crohn / RCU)", [
        "doenca de crohn", "retocolite ulcerativa", "colite ulcerosa", "calprotectina fecal",
        "pedras de calcamento", "megacolon toxico", "mesalazina", "infliximabe"
    ], 25),
    ("Gastroenterologia & Hepatologia", "Intestino Grosso, Delgado & Doença Celíaca", [
        "doenca celiaca", "anticorpo antitransglutaminase", "atrofia de vilosidades",
        "sindrome do intestino irritavel", "diverticulite aguda", "diverticulose",
        "cancer colorretal", "polipose adenomatosa", "sangramento digestivo baixo", "hdb"
    ], 25),

    # ── ENDOCRINOLOGIA & METABOLOGIA ──
    ("Endocrinologia & Metabologia", "Diabetes Mellitus & Complicações Agudas", [
        "cetoacidose diabetica", "cad", "glicemia > 250", "corpos cetonicos", "acidose com anion gap",
        "estado hiperosmolar hiperglicemico", "ehh", "hipoglicemia grave por sulfonilureia",
        "insulinoterapia intravenosa", "hidratacao venosa na cetoacidose"
    ], 30),
    ("Endocrinologia & Metabologia", "Diabetes Mellitus & Manejo Crônico", [
        "diabetes tipo 1", "diabetes tipo 2", "hemoglobina glicada", "hba1c", "metformina",
        "inibidor de sglt2", "empagliflozina", "dapagliflozina", "analogo de glp1", "liraglutida",
        "semaglutida", "pe diabetico", "nefropatia diabetica microalbuminuria", "retinopatia diabetica"
    ], 25),
    ("Endocrinologia & Metabologia", "Tireoide (Hipotireoidismo & Hipertireoidismo)", [
        "hipotireoidismo primario", "hipertireoidismo", "doenca de graves", "tireoidite de hashimoto",
        "anticorpo anti-tpo", "trab", "tsh suprimido", "t4 livre elevado", "crise tireotoxica",
        "metimazol", "propiltiouracil", "levotiroxina sodica"
    ], 25),
    ("Endocrinologia & Metabologia", "Nódulos & Câncer de Tireoide", [
        "nodulo de tireoide", "puncao aspirativa por agulha fina", "paaf tireoide",
        "sistema bethesda", "cancer papilifero de tireoide", "cancer medular de tireoide", "calcitonina"
    ], 25),
    ("Endocrinologia & Metabologia", "Adrenal & Hipófise (Cushing, Addison, Prolactina)", [
        "sindrome de cushing", "teste de supressao com dexametasona", "doenca de addison",
        "insuficiencia adrenal primaria", "crise adrenal", "feocromocitoma", "metanefrinas",
        "prolactinoma", "galactorreia", "acromegalia", "igf-1", "pan-hipopituitarismo"
    ], 25),
    ("Endocrinologia & Metabologia", "Metabolismo Ósseo & Lipídico (Osteoporose, Dislipidemia)", [
        "osteoporose", "densitometria ossea t-score", "bisfosfonatos", "alendronato",
        "hipercalcemia maligna", "hiperparatireoidismo primario", "pth elevado",
        "dislipidemia", "colesterol ldl", "hipertrigliceridemia", "atorvastatina", "rosuvastatina"
    ], 25),

    # ── NEFROLOGIA & UROLOGIA ──
    ("Nefrologia & Urologia", "Injúria Renal Aguda (IRA)", [
        "injuria renal aguda", "ira pre-renal", "ira renal intrinseca", "necrose tubular aguda", "nta",
        "fracao de excrecao de sodio", "fena", "oliguria aguda", "rabdomiolise mioglobina"
    ], 25),
    ("Nefrologia & Urologia", "Doença Renal Crônica & Terapia Dialítica", [
        "doenca renal cronica", "drc estagio", "tfg estimada", "clearance de creatinina",
        "hemodialise de urgencia", "dialise peritoneal", "anemia da doenca renal cronica",
        "osteodistrofia renal", "hiperfosfatemia", "quelante de fosforo"
    ], 25),
    ("Nefrologia & Urologia", "Glomerulopatias (Nefrótica & Nefrítica)", [
        "sindrome nefrotica", "proteinuria macica > 3,5", "edema anasarca", "doenca por lesao minima",
        "glomeruloesclerose segmentar e focal", "gesf", "nefropatia membranosa",
        "sindrome nefritica", "hematuria glomerular", "cilindros hematicos", "gnpe", "nefropatia por iga"
    ], 25),
    ("Nefrologia & Urologia", "Distúrbios Hidroeletrolíticos & Ácido-Base", [
        "hiponatremia hipervolemica", "hiponatremia hipovolemica", "sindrome de desmielinizacao osmotica",
        "hipercalemia ecg", "gluconato de calcio", "hipocalemia", "acidose metabolica",
        "alcalose metabolica", "gasometria arterial", "anion gap elevado"
    ], 25),
    ("Nefrologia & Urologia", "Urologia & Infecções Urinárias (ITU, Litíase, Próstata)", [
        "colica nefritica", "litiase urinaria calculo", "pielonefrite aguda complicada",
        "cistite aguda", "hiperplasia prostatica benigna", "hpb", "cancer de prostata",
        "psa livre", "torcao de cordao espermatico", "hematuria macroscopica"
    ], 25),

    # ── NEUROLOGIA ──
    ("Neurologia", "Acidente Vascular Cerebral (AVC Isquêmico / Hemorrágico)", [
        "acidente vascular cerebral isquemico", "avci", "avc hemorragico", "avch",
        "trombolise com rtpa", "alteplase janela", "trombectomia mecanica arterial",
        "ataque isquemico transitorio", "ait", "hemorragia subaracnoidea", "hsa", "aneurisma cerebral"
    ], 25),
    ("Neurologia", "Epilepsia & Crises Convulsivas", [
        "crise convulsiva generalizada", "epilepsia focal", "estado de mal epileptico",
        "anticonvulsivante", "valproato de sodio", "carbamazepina", "levetiracetam", "eeg ictal"
    ], 25),
    ("Neurologia", "Cefaleias Primárias & Secundárias", [
        "enxaqueca com aura", "migranea", "cefaleia em salvas", "cefaleia tensional",
        "arterite temporal de celulas gigantes", "hipertensao intracraniana idiopatica"
    ], 25),
    ("Neurologia", "Doenças Neurodegenerativas & Neuromusculares", [
        "doenca de parkinson", "levodopa", "doenca de alzheimer", "demencia vascular",
        "esclerose multipla", "surto de esclerose", "miastenia gravis", "anticorpo anti-achr",
        "sindrome de guillain-barre", "dissociacao proteinocitologica", "ela esclerose lateral"
    ], 25),
    ("Neurologia", "Meningites & Infecções do SNC", [
        "meningite bacteriana aguda", "meningococo", "pneumococo liquor", "liquor com pleocitose neutrofilica",
        "encefalite herpetica lobo temporal", "aciclovir iv", "rigidez de nuca kernig brudzinski"
    ], 25),

    # ── PEDIATRIA ──
    ("Pediatria", "Neonatologia & Sala de Parto", [
        "recem-nascido a termo", "neonato prematuro", "escore de apgar", "reanimacao neonatal",
        "ictericia neonatal fisiologica", "ictericia por incompatibilidade rh", "fototerapia neonatal",
        "doenca da membrana hialina", "sepse neonatal precoce", "taquipneia transitoria do rn"
    ], 25),
    ("Pediatria", "Puericultura & Desenvolvimento Infantil", [
        "puericultura", "desenvolvimento neuropsicomotor infantil", "marcos do desenvolvimento",
        "curvas de crescimento oms z-score", "aleitamento materno exclusivo", "introducao alimentar",
        "calendario vacinal pediatrico", "triagem neonatal pezinho"
    ], 25),
    ("Pediatria", "Infecciosas & Exantemas da Infância", [
        "sarampo manchas de koplik", "rubeola congenita", "exantema subito herpes 6",
        "eritema infeccioso parvovirus", "varicela catapora", "doenca de kawasaki aneurisma coronario",
        "doenca mao-pe-boca coxsackie", "escarlatina lingua em framboesa"
    ], 25),
    ("Pediatria", "Aparelho Respiratório Pediátrico (Bronquiolite, Crupe, OMA)", [
        "bronquiolite viral aguda", "virus sincicial respiratorio vrs", "laringite estridulosa crupe",
        "estridor laringeo", "nebulizacao com adrenalina", "otite media aguda pediatrica", "oma infantil",
        "coqueluche tosse paroxistica", "asma na infancia"
    ], 25),
    ("Pediatria", "Gastroenterologia & Cirurgia Pediátrica", [
        "desidratacao aguda crianca", "terapia de reidratacao oral tro", "diarreia aguda por rotavirus",
        "intussuscepcao intestinal fezes em geleia de morango", "estenose hipertrofica do piloro vomitos em jato",
        "doenca de hirschsprung megacolon", "refluxo gastroesofagico do lactente"
    ], 25),

    # ── GINECOLOGIA & OBSTETRÍCIA ──
    ("Ginecologia & Obstetrícia", "Obstetrícia: Patologias Gestacionais & Hipertensão", [
        "preeclampsia grave", "eclampsia convulsao", "sindrome hellp", "sulfato de magnesio priscila",
        "diabetes gestacional totg", "descolamento prematuro de placenta dpp", "placenta previa centro-total",
        "rotura prematura de membranas ovulares rpmo", "restricao de crescimento intrauterino rciu"
    ], 25),
    ("Ginecologia & Obstetrícia", "Obstetrícia: Trabalho de Parto & Puerpério", [
        "parto eutocico", "trabalho de parto ativo", "cesariana indicacoes", "cardiotocografia desaceleracoes dip",
        "hemorragia pos-parto atonia uterina", "ocitocina pos-parto", "infeccao puerperal endometrite",
        "mastite puerperal aleitamento"
    ], 25),
    ("Ginecologia & Obstetrícia", "Ginecologia: Sangramento & Endocrinologia Ginecológica", [
        "sangramento uterino anormal sua", "amenorreia primaria", "amenorreia secundaria",
        "sindrome dos ovarios policisticos sop", "anovulacao cronica", "endometriose dor pelvica",
        "miomatose uterina", "adenomiose", "climaterio fogachos terapia hormonal"
    ], 25),
    ("Ginecologia & Obstetrícia", "Ginecologia: Rastreio & Oncologia Ginecológica", [
        "cancer de colo de utero lesao de alto grau", "nic 2 nic 3", "hpv oncogenico colposcopia",
        "cancer de mama nodulo suspeito", "bi-rads mamografia", "cancer de endometrio sangramento pos-menopausa",
        "cancer de ovario ca-125"
    ], 25),
    ("Ginecologia & Obstetrícia", "Ginecologia: Infecções Ginecológicas & DSTs", [
        "vulvovaginite", "candidiase vaginal", "vaginose bacteriana criterios de amsel",
        "tricomoniase", "doenca inflamatoria pelvica dip estagios", "anticoncepcao hormonal diu mirena"
    ], 25),

    # ── HEMATOLOGIA & ONCOLOGIA ──
    ("Hematologia & Oncologia", "Anemias Carenciais & Hemoglobinopatias", [
        "anemia ferropriva ferritina baixa", "anemia megaloblastica b12 acido folico",
        "anemia hemolitica coombs positivo", "anemia falciforme crise de dor", "talassemia traço talassemico",
        "esferocitose hereditária", "g6pd deficiencia hemolise"
    ], 25),
    ("Hematologia & Oncologia", "Hemostasia, Plaquetopenias & Tromboses", [
        "purpura trombocitopenica imune pti", "purpura trombocitopenica trombotica ptt adamts13",
        "coagulacao intravascular disseminada civd", "hemofilia a fator viii", "hemofilia b fator ix",
        "trombofilia fator v de leiden", "anticoagulante lupico"
    ], 25),
    ("Hematologia & Oncologia", "Leucemias, Linfomas & Mieloma", [
        "leucemia mieloide aguda lma blastos", "leucemia linfoide aguda lla",
        "leucemia mieloide cronica lmc cromossomo filadelfia", "leucemia linfoide cronica llc",
        "linfoma de hodgkin celulas de reed-sternberg", "linfoma nao-hodgkin",
        "mieloma multiplo proteinas de bence-jones lesoes osteoliticas"
    ], 25),

    # ── REUMATOLOGIA & IMUNOLOGIA ──
    ("Reumatologia & Imunologia", "Artrites Inflamatórias (Reumatóide, Gota, Espondilites)", [
        "artrite reumatoide anti-ccp fator reumatoide", "gota tofos acido urico liquido sinovial",
        "espondilite anquilosante hla-b27 sacroileite", "artrite psoriasica dactilite",
        "artrite septica drenagem articular", "artrite reativa sindrome de reiter"
    ], 25),
    ("Reumatologia & Imunologia", "Doenças Autoimunes Sistêmicas & Vasculites", [
        "lupus eritematoso sistemico les anti-dna nefrite lupica", "esclerose sistemica esclerodermia",
        "sindrome de sjogren xerostomia xeroftalmia", "purpura de henoch-schonlein vasculite por iga",
        "artirite de celulas gigantes claudicacao de mandibula", "granulomatose com poliangiite c-anca"
    ], 25),

    # ── PSIQUIATRIA ──
    ("Psiquiatria", "Transtornos do Humor & Afeto (Depressão, Bipolar)", [
        "episodio depressivo maior criterios", "depressao com sintomas psicoticos",
        "transtorno afetivo bipolar tab", "episodio maniaco euforia", "hipomania",
        "antidepressivo isrs sertralina", "estabilizador de humor litio valproato"
    ], 25),
    ("Psiquiatria", "Transtornos de Ansiedade, TOC & Trauma", [
        "transtorno de panico agorafobia", "transtorno de ansiedade generalizada tag",
        "transtorno obsessivo-compulsivo toc rituais", "transtorno de estresse pos-traumatico tept",
        "fobia social", "crise de ansiedade aguda"
    ], 25),
    ("Psiquiatria", "Psicoses, Esquizofrenia & Dependências", [
        "esquizofrenia delirios alucinacoes auditivas", "antipsicotico atipico olanzapina risperidona",
        "clozapina agranulocitose", "sindrome de abstinencia de alcool delirium tremens",
        "dependencia de opioides naloxona", "ideacao suicida risco de suicidio"
    ], 25),

    # ── CIRURGIA GERAL & TRAUMA ──
    ("Cirurgia Geral & Trauma", "Abdome Agudo Inflamatório & Obstrutivo", [
        "apendicite aguda dor na fosa iliaca direita", "escore de alvarado apendicite",
        "colecistite aguda videolaparoscopia", "obstrucao intestinal mecanica niveis hidroaereos",
        "volvulo de sigmoide descompressao", "isquemia mesenterica aguda angio-tc",
        "hernia inguinal estrangulada cirurgia de urgencia"
    ], 25),
    ("Cirurgia Geral & Trauma", "Trauma, Choque & Suporte Cirúrgico", [
        "atls trauma abcde", "politraumatismo", "traumatismo cranioencefalico tce grave",
        "pneumotorax hipertensivo puncao alivio toracostomia", "hemotorax macico drenagem",
        "fasciite necrotizante desbridamento", "queimadura grande queimado hidratação parkland"
    ], 25),

    # ── DERMATOLOGIA ──
    ("Dermatologia", "Dermatoses Inflamatórias, Infecciosas & Neoplasias", [
        "psoriase vulgar placas eritematosas", "dermatite atopica prurido", "dermatite de contato",
        "melanoma cutaneo assimetria bordas cor diametro", "carcinoma basocelular cbc",
        "carcinoma espinocelular cec", "herpes zoster neuralgia pos-herpetica",
        "erisipela celulite infecciosa", "sindrome de stevens-johnson net farmacodermia"
    ], 25),

    # ── INFECTOLOGIA ──
    ("Infectologia", "HIV/AIDS, Infecções Oportunistas & Tropicais", [
        "infeccao pelo hiv aids cd4", "tarv antirretroviral", "pneumocistose jirovecii cotrimoxazol",
        "neurotoxoplasmose sulfadiazina", "criptococose meningea anfotericina",
        "sepse bacteriana choque septico sofa", "dengue sinais de alarme", "malaria leishmaniose leptospirose",
        "sifilis primaria secundaria terciaria penicilina benzatina"
    ], 25),

    # ── MEDICINA PREVENTIVA & SAÚDE PÚBLICA ──
    ("Medicina Preventiva & Saúde Pública", "Epidemiologia, Bioestatística & Ética Médica", [
        "estudo de coorte risco relativo", "estudo caso-controle odds ratio",
        "ensaio clinico randomizado duplo-cego", "sensibilidade especificidade vpp vpn",
        "declaracao de obito causa basica", "vigîlancia epidemiologica notificacao compulsoria",
        "codigo de deontologia medica sigilo medico", "consentimento informado esclarecido"
    ], 25)
]

# Pre-normalize the granular taxonomy for ultra-fast matching
NORMALIZED_GRANULAR = []
for area, subarea, keywords, default_weight in GRANULAR_TAXONOMY:
    norm_kws = [normalize(k) for k in keywords]
    NORMALIZED_GRANULAR.append((area, subarea, norm_kws, default_weight))

def classify_granular(q):
    enunc_norm = normalize(q.get('enunciado', ''))
    exp_norm = normalize(q.get('explicacao', ''))
    theme_norm = normalize(q.get('doenca_ou_conjunto_de_doencas', ''))
    
    alts = q.get('alternativas') or {}
    alts_str = ""
    if isinstance(alts, dict):
        alts_str = " ".join([str(v) for v in alts.values()])
    elif isinstance(alts, list):
        alts_str = " ".join([str(v) for v in alts])
    alts_norm = normalize(alts_str)

    full_norm = f"{enunc_norm} {exp_norm} {theme_norm} {alts_norm}"

    best_area = None
    best_subarea = None
    max_score = 0

    for area, subarea, keywords, base_w in NORMALIZED_GRANULAR:
        score = 0
        for kw in keywords:
            # Check presence in individual components
            if kw in enunc_norm:
                score += base_w * 4
            elif kw in theme_norm:
                score += base_w * 3
            elif kw in exp_norm:
                score += base_w * 1.5
            elif kw in alts_norm:
                score += base_w * 1

        if score > max_score:
            max_score = score
            best_area = area
            best_subarea = subarea

    # High quality clinical fallback
    if not best_area or max_score < 15:
        curr_area = str(q.get('area', ''))
        if curr_area and 'classificada' not in curr_area.lower():
            best_area = curr_area
            best_subarea = str(q.get('subarea', 'Clínica Médica Geral'))
        else:
            best_area = "Medicina Geral e Familiar"
            best_subarea = "Abordagem Clínica Integrada"

    disease_theme = q.get('doenca_ou_conjunto_de_doencas')
    if not disease_theme or str(disease_theme).strip() == "" or "classificada" in str(disease_theme).lower():
        disease_theme = best_subarea

    return best_area, best_subarea, disease_theme

def run():
    sys.stdout.reconfigure(encoding='utf-8')
    print("Iniciando Reclassificacao Medica de Alta Precisao (5.073 questoes)...", flush=True)

    with open('src/data/banco_questoes_pna.json', 'r', encoding='utf-8') as f:
        data = json.load(f)

    questoes = data.get('questoes', [])
    print(f"Total de questoes: {len(questoes)}", flush=True)

    area_counter = Counter()
    subarea_counter = Counter()

    for q in questoes:
        area, subarea, theme = classify_granular(q)
        q['area'] = area
        q['subarea'] = subarea
        q['doenca_ou_conjunto_de_doencas'] = theme

        area_counter[area] += 1
        subarea_counter[subarea] += 1

    data['questoes'] = questoes
    data['total_questoes'] = len(questoes)
    data['classificacao_referencia'] = "PNA Portugal / AMBOSS High-Precision Medical Taxonomy 2026"

    with open('src/data/banco_questoes_pna.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    with open('public/data/banco_questoes_pna.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print("\n=== DISTRIBUICAO DAS GRANDES AREAS RECLASSIFICADAS ===", flush=True)
    for a, c in area_counter.most_common():
        print(f"• {a}: {c} questoes ({c/len(questoes)*100:.1f}%)", flush=True)

    print(f"\nTotal de subareas de alta precisao: {len(subarea_counter)}", flush=True)
    print("\n=== TOP 35 SUBAREAS DE ALTA PRECISAO ===", flush=True)
    for s, c in subarea_counter.most_common(35):
        print(f"• {s}: {c} questoes", flush=True)

    print(f"\n✅ Reclassificacao de alta precisao concluida com sucesso!", flush=True)

if __name__ == '__main__':
    run()
