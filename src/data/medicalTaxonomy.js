/**
 * Arsenal Oficial Canônico de Áreas e Subáreas Médicas PNA (Fixas e Imutáveis)
 */

export const MEDICAL_TAXONOMY = {
  "Cardiologia": [
    "Angina Estável & Doença Coronária Crônica",
    "Fibrilação Auricular & Arritmias",
    "Hipertensão Arterial & Emergências",
    "Insuficiência Cardíaca & Miocardiopatias",
    "Síndrome Coronariana Aguda & Infarto (IAM)",
    "Valvopatias, Endocardite & Aorta"
  ],
  "Dermatologia": [
    "Dermatoses Inflamatórias, Infecciosas & Câncer de Pele"
  ],
  "Endocrinologia & Metabologia": [
    "Adrenal, Hipófise & Gônadas",
    "Diabetes Mellitus: Diagnóstico & Manejo Crônico",
    "Diabetes: Complicações Agudas (Cetoacidose / EHH)",
    "Metabolismo Ósseo, Cálcio & Dislipidemias",
    "Tireoide: Disfunção, Nódulos & Câncer"
  ],
  "Gastroenterologia & Hepatologia": [
    "Cirrose Hepática & Hipertensão Portal",
    "Doença Inflamatória Intestinal (Crohn / RCU)",
    "Esôfago, Estômago & Doença Péptica",
    "Hepatites & Doenças Hepáticas",
    "Intestino, Diarreia & Doença Celíaca",
    "Litíase Biliar, Vias Biliares & Pâncreas"
  ],
  "Ginecologia & Obstetrícia": [
    "Ginecologia: Infecções Genitais & Contracepção",
    "Ginecologia: Rastreio & Cânceres Ginecológicos",
    "Ginecologia: Sangramento, Endometriose & Endócrino",
    "Obstetrícia: Parto, Puerpério & Hemorragias",
    "Obstetrícia: Patologias Gestacionais & Alto Risco"
  ],
  "Hematologia & Oncologia": [
    "Anemias Carenciais & Hemolíticas",
    "Hemostasia, Coagulação & Tromboses",
    "Neoplasias Hematológicas (Leucemias, Linfomas, Mieloma)"
  ],
  "Infectologia": [
    "HIV/AIDS, Infecções Oportunistas & Tropicais"
  ],
  "Nefrologia & Urologia": [
    "Distúrbios Eletrolíticos & Ácido-Base",
    "Doença Renal Crônica & Substituição Renal",
    "Glomerulopatias (Nefrótica & Nefrítica)",
    "Injúria Renal Aguda & Síndrome Urêmica",
    "Urologia, Litíase & Infecções Urinárias"
  ],
  "Neurologia": [
    "Acidente Vascular Cerebral (AVC Isquêmico / Hemorrágico)",
    "Cefaleias Primárias & Algias Craniofaciais",
    "Doenças Neurodegenerativas, Neuromusculares & SNC",
    "Epilepsia, Crises Convulsivas & Síncope"
  ],
  "Pediatria": [
    "Doenças Exantemáticas & Infecciosas da Infância",
    "Gastroenterologia & Cirurgia Pediátrica",
    "Neonatologia & Reanimação Neonatal",
    "Puericultura, Crescimento & Vacinação"
  ],
  "Pneumologia": [
    "Asma Brônquica",
    "Doença Pulmonar Obstrutiva Crônica (DPOC)",
    "Neoplasias Pulmonares & Doenças Intersticiais",
    "Pneumonias Adquiridas & Nosocomiais",
    "Tromboembolismo Pulmonar (TEP)",
    "Tuberculose Pulmonar & Pleural"
  ],
  "Psiquiatria": [
    "Psiquiatria da Infância & Emergências Psiquiátricas",
    "Transtornos Alimentares & da Personalidade",
    "Transtornos Psicóticos & Esquizofrenia",
    "Transtornos de Ansiedade, Pânico, Fobias & TOC",
    "Transtornos de Estresse, TEPT & Somatização",
    "Transtornos do Humor (Depressão & Bipolaridade)",
    "Transtornos por Uso de Substâncias & Adições"
  ],
  "Reumatologia & Imunologia": [
    "Artrites Inflamatórias (Reumatóide, Gota, Espondilites)",
    "Doenças Autoimunes Sistêmicas & Vasculites",
    "Dorsalgia, Lombalgia & Patologia da Coluna"
  ]
};

export const getAvailableAreas = () => Object.keys(MEDICAL_TAXONOMY);

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
