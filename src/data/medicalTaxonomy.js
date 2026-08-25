/**
 * Arsenal Oficial de Áreas e Subáreas Médicas PNA (Taxonomia Fixa Imutável)
 */

export const MEDICAL_TAXONOMY = {
  "Cardiologia": [
    "Angina Estável & Doença Coronária Crônica",
    "Arritmias & Eletrofisiologia",
    "Doença Isquêmica & Síndromes Coronarianas (IAM/Angina)",
    "Fibrilação Auricular & Arritmias",
    "Fibrilação Auricular, Arritmias & Eletrofisiologia",
    "Hipertensão Arterial & Emergências",
    "Insuficiência Cardíaca & Miocardiopatias",
    "Pericárdio, Miocardite & Aorta",
    "Síndrome Coronariana Aguda & Infarto (IAM)",
    "Valvopatias, Endocardite & Aorta"
  ],
  "Dermatologia": [
    "Dermatoses Inflamatórias, Infecciosas & Câncer de Pele"
  ],
  "Endocrinologia & Metabologia": [
    "Adrenal, Hipófise & Gônadas",
    "Diabetes Mellitus & Complicações Agudas",
    "Diabetes Mellitus & Manejo Crônico",
    "Diabetes Mellitus: Diagnóstico & Manejo Crônico",
    "Diabetes: Complicações Agudas (Cetoacidose / EHH)",
    "Metabolismo Ósseo, Cálcio & Dislipidemias",
    "Tireoide (Hipotireoidismo & Hipertireoidismo)",
    "Tireoide: Disfunção, Nódulos & Câncer"
  ],
  "Gastroenterologia & Hepatologia": [
    "Cirrose Hepática & Hipertensão Portal",
    "Doença Inflamatória Intestinal (Crohn / RCU)",
    "Esôfago & Estômago (DRGE, Úlcera, HDA)",
    "Esôfago, Estômago & Doença Péptica",
    "Hepatites & Doenças Hepáticas",
    "Intestino Grosso, Delgado & Doença Celíaca",
    "Intestino, Diarreia & Doença Celíaca",
    "Litíase Biliar, Vias Biliares & Pâncreas"
  ],
  "Ginecologia & Obstetrícia": [
    "Ginecologia: Infecções Genitais & Contracepção",
    "Ginecologia: Rastreio & Cânceres Ginecológicos",
    "Ginecologia: Sangramento & Endocrinologia Ginecológica",
    "Ginecologia: Sangramento, Endometriose & Endócrino",
    "Obstetrícia: Parto, Puerpério & Hemorragias",
    "Obstetrícia: Patologias Gestacionais & Alto Risco",
    "Obstetrícia: Trabalho de Parto & Puerpério"
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
    "Distúrbios Hidroeletrolíticos & Ácido-Base",
    "Doença Renal Crônica & Substituição Renal",
    "Glomerulopatias (Nefrótica & Nefrítica)",
    "Injúria Renal Aguda & Síndrome Urêmica",
    "Injúria Renal Aguda (IRA)",
    "Urologia, Litíase & Infecções Urinárias"
  ],
  "Neurologia": [
    "Acidente Vascular Cerebral (AVC Isquêmico / Hemorrágico)",
    "Cefaleias Primárias & Algias Craniofaciais",
    "Doenças Neurodegenerativas, Neuromusculares & SNC",
    "Epilepsia, Crises Convulsivas & Síncope"
  ],
  "Pediatria": [
    "Gastroenterologia & Cirurgia Pediátrica",
    "Infectologia & Exantemas Pediátricos",
    "Neonatologia & Puericultura",
    "Neonatologia & Reanimação Neonatal",
    "Puericultura & Desenvolvimento Infantil"
  ],
  "Pneumologia": [
    "Asma & DPOC",
    "Asma Brônquica",
    "Doença Pulmonar Obstrutiva Crônica (DPOC)",
    "Neoplasias Pulmonares & Doenças Intersticiais",
    "Pneumonias & Infecções Respiratórias",
    "Pneumonias Adquiridas & Nosocomiais",
    "Tromboembolismo Pulmonar (TEP)",
    "Tuberculose Pulmonar & Pleural"
  ],
  "Psiquiatria": [
    "Transtornos de Ansiedade, TOC & Estresse"
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
