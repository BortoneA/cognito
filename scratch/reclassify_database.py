import json
import re
import sys

# Comprehensive clinical taxonomy with regex-safe tokens
TAXONOMY_RULES = [
    # Ginecologia & Obstetrícia
    ("Ginecologia & Obstetrícia", "Obstetrícia & Gestação de Alto Risco", [
        r"\bgestante\b", r"\bgravidez\b", r"\bpré-natal\b", r"\btrabalho de parto\b", r"\bcesariana\b",
        r"\bpreeclâmpsia\b", r"\beclâmpsia\b", r"\bsíndrome hellp\b", r"\bdiabetes gestacional\b",
        r"\bhemorragia pós-parto\b", r"\bdescolamento prematuro\b", r"\bplacenta prévia\b",
        r"\babortamento\b", r"\bgravidez ectópica\b", r"\blíquido amniótico\b", r"\bcardiotocografia\b",
        r"\bprematuridade\b", r"\bruptura de membranas\b", r"\bcorioamnionite\b"
    ]),
    ("Ginecologia & Obstetrícia", "Ginecologia Geral & Oncologia", [
        r"\bciclo menstrual\b", r"\bamenorreia\b", r"\bsangramento uterino\b", r"\banticoncep",
        r"\bdispositivo intrauterino\b", r"\bdiu\b", r"\bsíndrome dos ovários policísticos\b", r"\bsop\b",
        r"\bendometriose\b", r"\bmioma\b", r"\bcâncer de colo\b", r"\bhpv\b", r"\bpapanicolau\b",
        r"\bcâncer de mama\b", r"\bmamografia\b", r"\bvaginite\b", r"\bcandidíase\b", r"\bvaginose\b",
        r"\btricomoníase\b", r"\bdoença inflamatória pélvica\b", r"\bdip\b", r"\bclimatério\b", r"\bmenopausa\b"
    ]),

    # Pediatria
    ("Pediatria", "Neonatologia & Puericultura", [
        r"\brecém-nascido\b", r"\bneonato\b", r"\bapgar\b", r"\bicterícia neonatal\b", r"\bprematuro\b",
        r"\bpuericultura\b", r"\bcrescimento e desenvolvimento\b", r"\bdnpm\b", r"\bamamentação\b",
        r"\bleite materno\b", r"\bvacina", r"\bimunização\b", r"\bteste do pezinho\b", r"\bfontanela\b"
    ]),
    ("Pediatria", "Infectologia & Exantemas Pediátricos", [
        r"\bsarampo\b", r"\brubéola\b", r"\bexantema súbito\b", r"\beritema infeccioso\b", r"\bvaricela\b",
        r"\bcatapora\b", r"\bbronquiolite\b", r"\bvrs\b", r"\blaringite estridulosa\b", r"\bcrupe\b",
        r"\botite média aguda\b", r"\boma\b", r"\bconvulsão febril\b", r"\bcoqueluche\b", r"\bparotidite\b",
        r"\bdoença mão-pé-boca\b", r"\bkawasaki\b"
    ]),
    ("Pediatria", "Emergências & Doenças Pediátricas", [
        r"\bdesidratação infantil\b", r"\btro\b", r"\bintussuscepção\b", r"\bestenose hipertrófica do piloro\b",
        r"\bfibrose cística\b", r"\bteste do suor\b", r"\brefluxo gastroesofágico pediátrico\b",
        r"\basma infantil\b", r"\bmonoartrite na infância\b", r"\bquadril doloroso\b"
    ]),

    # Cardiologia
    ("Cardiologia", "Síndromes Coronarianas & Isquemia", [
        r"\binfarto\b", r"\biam\b", r"\bcoronári", r"\bangina\b", r"\btroponina\b", r"\bck-mb\b",
        r"\bsupra de st\b", r"\bstemi\b", r"\bisquemia miocárdica\b", r"\bcateterismo cardíaco\b",
        r"\bangioplastia\b", r"\bstent coronário\b", r"\bdor precordial típica\b"
    ]),
    ("Cardiologia", "Insuficiência Cardíaca & Miocardiopatias", [
        r"\binsuficiência cardíaca\b", r"\bicfe\b", r"\bfração de ejeção\b", r"\bbnp\b", r"\bpro-bnp\b",
        r"\bedema agudo de pulmão\b", r"\bortopneia\b", r"\bdispneia paroxística\b", r"\bcardiomiopatia\b",
        r"\bterceira bulha\b", r"\bb3\b", r"\bsacubitril\b", r"\bdigoxina\b", r"\bchagas miocárdico\b"
    ]),
    ("Cardiologia", "Arritmias & Eletrofisiologia", [
        r"\bfibrilação auricular\b", r"\bfibrilação atrial\b", r"\bflutter atrial\b", r"\btaquicardia ventricular\b",
        r"\btaquicardia supraventricular\b", r"\btsv\b", r"\bbloqueio atrioventricular\b", r"\bbav de\b",
        r"\bwolff-parkinson-white\b", r"\bcardioversão\b", r"\bdesfibrilação\b", r"\bmarcapasso\b",
        r"\bextrassístole\b", r"\bintervalo qt\b", r"\btorsades de pointes\b"
    ]),
    ("Cardiologia", "Hipertensão Arterial & Urgências", [
        r"\bhipertensão arterial\b", r"\bcrise hipertensiva\b", r"\bemergência hipertensiva\b",
        r"\bmapa 24h\b", r"\bhipertensão resistente\b", r"\bhiperaldosteronismo primário\b"
    ]),
    ("Cardiologia", "Valvopatias & Pericárdio", [
        r"\bestenose aórtica\b", r"\binsuficiência mitral\b", r"\bestenose mitral\b", r"\binsuficiência aórtica\b",
        r"\bendocardite infecciosa\b", r"\bcritérios de duke\b", r"\bpericardite aguda\b", r"\btamponamento cardíaco\b",
        r"\bdissecção de aorta\b", r"\baneurisma aórtico\b"
    ]),

    # Pneumologia
    ("Pneumologia", "Asma & DPOC", [
        r"\basma brônquica\b", r"\basma\b", r"\bdpoc\b", r"\benfisema pulmonar\b", r"\bbronquite crônica\b",
        r"\bespirometria\b", r"\bvef1\b", r"\bbroncodilatador\b", r"\bsalbutamol\b", r"\bcorticoide inalatório\b",
        r"\bsibilância\b", r"\bchiado no peito\b"
    ]),
    ("Pneumologia", "Pneumonias & Supurações Pulmonares", [
        r"\bpneumonia adquirida\b", r"\bpneumonia\b", r"\bcurb-65\b", r"\bderrame pleural parapneumônico\b",
        r"\bempiema pleural\b", r"\bbronquiectasias\b", r"\babscesso pulmonar\b", r"\bmycoplasma pneumoniae\b",
        r"\blegionella\b", r"\bpneumococo\b"
    ]),
    ("Pneumologia", "Tromboembolismo Pulmonar & Circulação", [
        r"\btromboembolismo pulmonar\b", r"\btep\b", r"\bembolia pulmonar\b", r"\bdímero-d\b",
        r"\bangiotomografia de tórax\b", r"\bescore de wells\b", r"\bhipertensão pulmonar\b"
    ]),
    ("Pneumologia", "Tuberculose & Doenças Intersticiais", [
        r"\btuberculose pulmonar\b", r"\bbaciloscopia\b", r"\bgene-xpert\b", r"\brifampicina\b",
        r"\bisoniazida\b", r"\bfibrose pulmonar idiopática\b", r"\bsarcoidose\b", r"\bpneumotórax espontâneo\b",
        r"\bnódulo pulmonar solitário\b", r"\bcâncer de pulmão\b"
    ]),

    # Gastroenterologia & Hepatologia
    ("Gastroenterologia & Hepatologia", "Hepatologia & Cirrose", [
        r"\bcirrose hepática\b", r"\bhepatite b\b", r"\bhepatite c\b", r"\bhepatite autoimune\b",
        r"\bhipertensão portal\b", r"\bvarizes esofágicas\b", r"\bascite volumosa\b", r"\bpbe\b",
        r"\bperitonite bacteriana espontânea\b", r"\bencefalopatia hepática\b", r"\bhemocromatose\b",
        r"\bdoença de wilson\b", r"\bcarcinoma hepatocelular\b", r"\bhcc\b", r"\besteatohepatite\b"
    ]),
    ("Gastroenterologia & Hepatologia", "Vias Biliares & Pâncreas", [
        r"\bcoledocolitíase\b", r"\bcolangite aguda\b", r"\btríade de charcot\b", r"\bpêntade de reynolds\b",
        r"\bcolecistite aguda\b", r"\bsinal de murphy\b", r"\bpancreatite aguda\b", r"\bpancreatite crônica\b",
        r"\bamilase\b", r"\blipase\b", r"\bcâncer de pâncreas\b", r"\bcolangite esclerosante\b"
    ]),
    ("Gastroenterologia & Hepatologia", "Esôfago, Estômago & Duodeno", [
        r"\bdrge\b", r"\bdoença do refluxo\b", r"\besôfago de barrett\b", r"\bacalásia\b", r"\búlcera péptica\b",
        r"\búlcera gástrica\b", r"\búlcera duodenal\b", r"\bhelicobacter pylori\b", r"\bh\. pylori\b",
        r"\bhemorragia digestiva alta\b", r"\bhda\b", r"\bmelena\b", r"\bhematêmese\b", r"\bcâncer gástrico\b"
    ]),
    ("Gastroenterologia & Hepatologia", "Intestino & Doença Inflamatória", [
        r"\bdoença de crohn\b", r"\bcolite ulcerosa\b", r"\bretocolite ulcerativa\b", r"\bdoença celíaca\b",
        r"\bsíndrome do intestino irritável\b", r"\bdiverticulite aguda\b", r"\bcâncer colorretal\b",
        r"\bhemorragia digestiva baixa\b", r"\bhdb\b", r"\bpólipos colônicos\b", r"\bcolonoscopia\b"
    ]),

    # Nefrologia & Urologia
    ("Nefrologia & Urologia", "Injúria Renal & DRC", [
        r"\binjúria renal aguda\b", r"\bira pré-renal\b", r"\bdoença renal crônica\b", r"\bdrc\b",
        r"\bclearance de creatinina\b", r"\btaxa de filtração glomerular\b", r"\btfg\b", r"\bhemodiálise\b",
        r"\bdiálise peritoneal\b", r"\buremia\b", r"\bosteodistrofia renal\b"
    ]),
    ("Nefrologia & Urologia", "Glomerulopatias & Tubulopatias", [
        r"\bsíndrome nefrótica\b", r"\bsíndrome nefrítica\b", r"\bglomerulonefrite\b", r"\bproteinúria nefrótica\b",
        r"\bnefropatia por iga\b", r"\bdoença de berger\b", r"\bnefropatia membranosa\b", r"\blesão mínima\b",
        r"\bgnpe\b", r"\bnefrite lúpica\b", r"\bnefrite intersticial aguda\b"
    ]),
    ("Nefrologia & Urologia", "Distúrbios Eletrolíticos & Ácido-Base", [
        r"\bhiponatremia\b", r"\bhipernatremia\b", r"\bhipocaliemia\b", r"\bhipercaliemia\b",
        r"\bacidose metabólica\b", r"\balcalose metabólica\b", r"\banion gap\b", r"\bsiad\b",
        r"\bdiabetes insipidus\b"
    ]),
    ("Nefrologia & Urologia", "Urologia & Infecções Urinárias", [
        r"\bcólica nefrítica\b", r"\blitíase urinária\b", r"\bcálculo renal\b", r"\bpielonefrite aguda\b",
        r"\bcistite aguda\b", r"\bhiperplasia prostática\b", r"\bhbp\b", r"\bcâncer de próstata\b",
        r"\bpsa elevado\b", r"\btorção testicular\b", r"\bhematúria macroscópica\b"
    ]),

    # Neurologia
    ("Neurologia", "Doenças Cerebrovasculares (AVC)", [
        r"\bavc isquêmico\b", r"\bavc hemorrágico\b", r"\bataque isquêmico transitório\b", r"\bait\b",
        r"\btrombólise química\b", r"\balteplase\b", r"\btrombectomia mecânica\b",
        r"\bhemorragia subaracnoidea\b", r"\bhsa\b", r"\baneurisma cerebral roto\b"
    ]),
    ("Neurologia", "Epilepsia & Cefaleias", [
        r"\bcrise epiléptica\b", r"\bepilepsia refratária\b", r"\bestado de mal epiléptico\b",
        r"\benxaqueca\b", r"\bmigrânea com aura\b", r"\bcefaleia em salvas\b", r"\bcefaleia tensional\b",
        r"\bhipertensão intracraniana idiopática\b"
    ]),
    ("Neurologia", "Doenças Neurodegenerativas & Neuromusculares", [
        r"\bdoença de parkinson\b", r"\bdoença de alzheimer\b", r"\bdemência vascular\b", r"\bdemência por corpos de lewy\b",
        r"\besclerose múltipla\b", r"\bmiastenia gravis\b", r"\bsíndrome de guillain-barré\b",
        r"\besclerose lateral amiotrófica\b", r"\bela\b", r"\bpolineuropatia\b"
    ]),
    ("Neurologia", "Infecções do SNC & Coma", [
        r"\bmeningite bacteriana\b", r"\bmeningite viral\b", r"\bencefalite herpética\b",
        r"\brigidez de nuca\b", r"\blíquor purulento\b", r"\bescala de glasgow\b", r"\bmorte encefálica\b"
    ]),

    # Endocrinologia & Metabologia
    ("Endocrinologia & Metabologia", "Diabetes Mellitus & Complicações", [
        r"\bdiabetes mellitus\b", r"\bdiabetes tipo 1\b", r"\bdiabetes tipo 2\b", r"\bhba1c\b",
        r"\bcetoacidose diabética\b", r"\bcad\b", r"\bestado hiperosmolar hiperglicêmico\b",
        r"\bhipoglicemia grave\b", r"\bretinopatia diabética\b", r"\bnefropatia diabética\b",
        r"\bpé diabético\b", r"\binsulinoterapia\b", r"\binibidores de sglt2\b", r"\banálogos de glp-1\b"
    ]),
    ("Endocrinologia & Metabologia", "Tireoide & Paratireoide", [
        r"\bhipotireoidismo primário\b", r"\bhipertireoidismo\b", r"\bdoença de graves\b",
        r"\btireoidite de hashimoto\b", r"\btireoidite subaguda\b", r"\bnódulo tireoidiano\b",
        r"\bcâncer papilífero\b", r"\btsh suprimido\b", r"\bhiperparatireoidismo\b", r"\bhipercalcemia maligna\b"
    ]),
    ("Endocrinologia & Metabologia", "Adrenal, Hipófise & Metabolismo Ósseo", [
        r"\bsíndrome de cushing\b", r"\bdoença de addison\b", r"\binsuficiência adrenal\b",
        r"\bfeocromocitoma\b", r"\bprolactinoma\b", r"\bacromegalia\b", r"\bosteoporose pós-menopausa\b",
        r"\bdensitometria óssea\b", r"\bdislipidemia mista\b", r"\bestatinas\b"
    ]),

    # Hematologia & Oncologia
    ("Hematologia & Oncologia", "Anemias & Hemoglobinopatias", [
        r"\banemia ferropriva\b", r"\banemia megaloblástica\b", r"\bdeficiência de vitamina b12\b",
        r"\banemia hemolítica autoimune\b", r"\banemia falciforme\b", r"\bcrise vaso-oclusiva\b",
        r"\btalassemia maior\b", r"\btalassemia menor\b", r"\bsferocitose hereditária\b"
    ]),
    ("Hematologia & Oncologia", "Hemostasia, Trombose & Neoplasias", [
        r"\btrombocitopenia imune\b", r"\bpti\b", r"\bpúrpura trombocitopênica trombótica\b", r"\bptt\b",
        r"\bcivd\b", r"\bhemofilia a\b", r"\bhemofilia b\b", r"\bleucemia mieloide aguda\b",
        r"\bleucemia linfoide crônica\b", r"\blinfoma de hodgkin\b", r"\blinfoma não-hodgkin\b",
        r"\bmieloma múltiplo\b", r"\bproteína de bence-jones\b"
    ]),

    # Reumatologia & Imunologia
    ("Reumatologia & Imunologia", "Doenças Articulares Inflamatórias", [
        r"\bartrite reumatoide\b", r"\banti-ccp\b", r"\bfator reumatoide\b", r"\bgota úrica\b",
        r"\bataque de gota\b", r"\bcolchicina\b", r"\bespondilite anquilosante\b", r"\bhla-b27\b",
        r"\bartrite psoriásica\b", r"\bartrite reativa\b"
    ]),
    ("Reumatologia & Imunologia", "Doenças Autoimunes Sistêmicas & Vasculites", [
        r"\blúpus eritematoso sistêmico\b", r"\bles\b", r"\banti-dna dupla hélice\b", r"\besclerose sistêmica\b",
        r"\bsíndrome de sjögren\b", r"\bvasculite por iga\b", r"\bhenoch-schönlein\b", r"\bartrite de células gigantes\b",
        r"\bpolimialgia reumática\b", r"\bgranulomatose com poliangiite\b", r"\bwegener\b"
    ]),

    # Infectologia
    ("Infectologia", "HIV & Infecções Oportunistas", [
        r"\binfecção pelo hiv\b", r"\baids\b", r"\bcontagem de cd4\b", r"\bcarga viral indetectável\b",
        r"\btarv\b", r"\bpneumocistose\b", r"\btoxoplasmose cerebral\b", r"\bcriptococose\b"
    ]),
    ("Infectologia", "Sepse & Doenças Tropicais", [
        r"\bsepse grave\b", r"\bchoque séptico\b", r"\bescore sofa\b", r"\bhemocultura\b",
        r"\bdengue com sinais de alarme\b", r"\bchikungunya\b", r"\bmalária\b", r"\bleishmaniose\b",
        r"\bleptospirose\b", r"\bsífilis secundária\b", r"\bvdrl reagente\b"
    ]),

    # Psiquiatria
    ("Psiquiatria", "Transtornos de Humor & Ansiedade", [
        r"\bepisódio depressivo maior\b", r"\bdepressão resistente\b", r"\btranstorno bipolar\b",
        r"\bepisódio maníaco\b", r"\btranstorno de pânico\b", r"\btranstorno de ansiedade generalizada\b",
        r"\btag\b", r"\btranstorno obsessivo-compulsivo\b", r"\btoc\b", r"\bisrs\b", r"\blítio\b"
    ]),
    ("Psiquiatria", "Psicoses & Dependência Química", [
        r"\besquizofrenia paranoide\b", r"\bdelírio persecutório\b", r"\balucinação auditiva\b",
        r"\bclozapina\b", r"\bdelirium tremens\b", r"\bsíndrome de abstinência alcoólica\b",
        r"\brisco iminente de suicídio\b", r"\bacatisia\b", r"\bsíndrome neuroléptica maligna\b"
    ]),

    # Cirurgia Geral & Trauma
    ("Cirurgia Geral & Trauma", "Abdome Agudo & Cirurgia Digestiva", [
        r"\bapendicite aguda\b", r"\bescore de alvarado\b", r"\bcolecistite aguda calculosa\b",
        r"\bobstrução intestinal mecânica\b", r"\bvólvulo de sigmoide\b", r"\búlcera péptica perfurada\b",
        r"\bpneumoperitônio\b", r"\bisquemia mesentérica aguda\b", r"\bhérnia inguinal encarcerada\b",
        r"\bhérnia estrangulada\b"
    ]),
    ("Cirurgia Geral & Trauma", "Trauma & Cuidados Cirúrgicos", [
        r"\bpolitraumatizado\b", r"\batls\b", r"\btce grave\b", r"\bpneumotórax hipertensivo\b",
        r"\bdrenagem de tórax\b", r"\bhemotórax maciço\b", r"\bfasciite necrotizante\b", r"\bqueimaduras de 2º grau\b"
    ]),

    # Dermatologia
    ("Dermatologia", "Dermatoses & Neoplasias Cutâneas", [
        r"\bpsoríase em placas\b", r"\bdermatite atópica\b", r"\bdermatite de contato\b",
        r"\bmelanoma cutâneo\b", r"\bcarcinoma basocelular\b", r"\bcarcinoma espinocelular\b",
        r"\bhérpes-zóster\b", r"\berisipela de membros\b", r"\bcelulite infecciosa\b",
        r"\bfarmacodermia grave\b", r"\bsíndrome de stevens-johnson\b"
    ]),

    # Medicina Preventiva & Saúde Pública
    ("Medicina Preventiva & Saúde Pública", "Epidemiologia & Saúde Comunitária", [
        r"\bestudo de coorte\b", r"\bestudo caso-controle\b", r"\bensaio clínico randomizado\b",
        r"\bsensibilidade e especificidade\b", r"\bvalor preditivo positivo\b", r"\brisco relativo\b",
        r"\bodds ratio\b", r"\bdeclaração de óbito\b", r"\bvigilância epidemiológica\b",
        r"\batenção primária à saúde\b", r"\bcódigo de ética médica\b"
    ])
]

# Pre-compile regex rules for maximum execution speed
COMPILED_RULES = []
for area, subarea, patterns in TAXONOMY_RULES:
    c_patterns = [re.compile(p, re.IGNORECASE) for p in patterns]
    COMPILED_RULES.append((area, subarea, c_patterns))

def clean_text(item):
    if not item:
        return ""
    if isinstance(item, dict):
        return {k: clean_text(v) for k, v in item.items()}
    if isinstance(item, list):
        return [clean_text(v) for v in item]
    if not isinstance(item, str):
        return str(item)
    return item

def classify_question(q):
    enunciado = clean_text(q.get('enunciado', '')).lower()
    explicacao = clean_text(q.get('explicacao', '')).lower()
    doenca_curr = clean_text(q.get('doenca_ou_conjunto_de_doencas', '')).lower()
    
    alts_text = ""
    alts = q.get('alternativas')
    if isinstance(alts, dict):
        alts_text = " ".join([str(v) for v in alts.values()]).lower()
    elif isinstance(alts, list):
        alts_text = " ".join([str(v) for v in alts]).lower()

    full_text = f"{enunciado} {explicacao} {doenca_curr} {alts_text}"

    best_area = None
    best_subarea = None
    max_score = 0

    for area, subarea, c_patterns in COMPILED_RULES:
        score = 0
        for pat in c_patterns:
            matches_enunc = len(pat.findall(enunciado))
            matches_full = len(pat.findall(full_text))
            score += (matches_enunc * 4) + matches_full
            
        if score > max_score:
            max_score = score
            best_area = area
            best_subarea = subarea

    # High quality fallback
    if not best_area or max_score < 2:
        curr_area = str(q.get('area', ''))
        if curr_area and 'classificada' not in curr_area.lower():
            best_area = curr_area
            best_subarea = str(q.get('subarea', 'Clínica Geral'))
        else:
            best_area = "Medicina Geral e Familiar"
            best_subarea = "Abordagem Clínica Integrada"

    disease_theme = q.get('doenca_ou_conjunto_de_doencas')
    if not disease_theme or str(disease_theme).strip() == "":
        disease_theme = best_subarea

    return best_area, best_subarea, disease_theme

def run():
    sys.stdout.reconfigure(encoding='utf-8')
    print("Iniciando reclassificacao com regex pre-compilados...", flush=True)

    with open('src/data/banco_questoes_pna.json', 'r', encoding='utf-8') as f:
        data = json.load(f)

    questoes = data.get('questoes', [])
    print(f"Total de questoes: {len(questoes)}", flush=True)

    reclassified_count = 0
    area_counter = {}
    subarea_counter = {}

    for q in questoes:
        area, subarea, theme = classify_question(q)
        
        q['area'] = area
        q['subarea'] = subarea
        if not q.get('doenca_ou_conjunto_de_doencas') or str(q.get('doenca_ou_conjunto_de_doencas')).strip() == "":
            q['doenca_ou_conjunto_de_doencas'] = theme

        reclassified_count += 1
        area_counter[area] = area_counter.get(area, 0) + 1
        subarea_counter[subarea] = subarea_counter.get(subarea, 0) + 1

    data['questoes'] = questoes
    data['total_questoes'] = len(questoes)
    data['classificacao_referencia'] = "AMBOSS Clinical Classification / PNA Standard Taxonomy 2026"

    with open('src/data/banco_questoes_pna.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    with open('public/data/banco_questoes_pna.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print("\n--- DISTRIBUICAO DAS AREAS RECLASSIFICADAS ---", flush=True)
    for a, c in sorted(area_counter.items(), key=lambda x: x[1], reverse=True):
        print(f"{a}: {c} questoes ({c/len(questoes)*100:.1f}%)", flush=True)

    print(f"\nTotal de subareas especializadas: {len(subarea_counter)}", flush=True)
    print("\n--- TOP 25 SUBAREAS RECLASSIFICADAS ---", flush=True)
    for s, c in sorted(subarea_counter.items(), key=lambda x: x[1], reverse=True)[:25]:
        print(f"{s}: {c} questoes", flush=True)

    print(f"\nReclassificacao concluida com sucesso para todas as {reclassified_count} questoes!", flush=True)

if __name__ == '__main__':
    run()
