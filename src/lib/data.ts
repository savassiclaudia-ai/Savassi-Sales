import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export type Patient = {
  id: string;
  name: string;
  ltv: number;
  liq: number;
  cons: number;
  n_tx: number;
  first_visit: string;
  last_visit: string;
  top_kit: string;
  kits: string[];
  txs: Array<{
    ym: string;
    proc: string;
    cob: number;
    liq: number;
    cons: number;
    kit: string;
    pg: string;
  }>;
  phone: string;
  email: string;
  birth: string;
  cpf: string;
  address: string;
  city: string;
  indication: string;
  skin_type: string;
  allergies: string;
  obs: string;
  status: string;
  score: string;
};

// Batch 1: Top 10 Patients
export const CRM_DATA: Patient[] = [
  {
    "id": "PAC0001", "name": "Carla Elaine Antonio Prado Troyjo", "ltv": 121925.0, "liq": 94139.98, "cons": 22490.65, "n_tx": 26, "first_visit": "2024-02", "last_visit": "2025-10", "top_kit": "LIFTING PREMIUM",
    "kits": ["PELE & REJUVENESCIMENTO", "FIRMEZA & CONTORNO", "LIFTING PREMIUM", "DEPILAÇÃO", "OUTROS"],
    "txs": [
      {"ym": "2025-10", "proc": "THERMAGE FULL FACE + PESCOÇO, E EXOCUBE", "cob": 20000.0, "liq": 13820.0, "cons": 5700.0, "kit": "LIFTING PREMIUM", "pg": "CRÉDITO 2 A 6X"},
      {"ym": "2025-10", "proc": "THERMAGE FULL FACE + PESCOÇO,  E EXOCUBE", "cob": 11900.0, "liq": 8568.95, "cons": 3099.0, "kit": "LIFTING PREMIUM", "pg": "CRÉDITO"},
      {"ym": "2025-10", "proc": "CLARITY ROSTO", "cob": 595.0, "liq": 533.3975, "cons": 50.0, "kit": "PELE & REJUVENESCIMENTO", "pg": "CRÉDITO"},
      {"ym": "2025-07", "proc": "DEPILAÇÃO FACE", "cob": 595.0, "liq": 533.3975, "cons": 50.0, "kit": "DEPILAÇÃO", "pg": "CRÉDITO"},
      {"ym": "2025-03", "proc": "ULTRAFORMER MPT FLANCOS", "cob": 10025.0, "liq": 8584.6, "cons": 1199.8, "kit": "FIRMEZA & CONTORNO", "pg": "CRÉDITO 2 A 6X"},
    ],
    "phone": "(11) 98765-4321", "email": "carla.troyjo@example.com", "birth": "1980-05-15", "cpf": "123.456.789-00", "address": "Rua Fictícia, 123", "city": "São Paulo", "indication": "Instagram", "skin_type": "mista", "allergies": "Nenhuma", "obs": "Preferência por horários matutinos", "status": "ativo", "score": "A"
  },
  {
    "id": "PAC0002", "name": "Silvia Rodrigues Pachikoski", "ltv": 102675.6, "liq": 83096.75, "cons": 17773.9, "n_tx": 15, "first_visit": "2024-02", "last_visit": "2025-07", "top_kit": "FIRMEZA & CONTORNO",
    "kits": ["PELE & REJUVENESCIMENTO", "FIRMEZA & CONTORNO", "LIFTING PREMIUM", "DEPILAÇÃO", "CAPILAR", "OUTROS"],
    "txs": [
      {"ym": "2025-07", "proc": "3 SESSÕES DE RED TOUCH FULL FACE Com crédito Ultra", "cob": 7910.4, "liq": 7720.5504, "cons": 0.0, "kit": "LIFTING PREMIUM", "pg": "CRÉDITO 2 A 6X"},
      {"ym": "2025-07", "proc": "EXOCUBE CAPILAR", "cob": 8415.0, "liq": 5316.0, "cons": 3099.0, "kit": "CAPILAR", "pg": "TED/PIX"},
      {"ym": "2025-04", "proc": "DEPILAÇÃO LASER BUÇO", "cob": 240.0, "liq": 215.32, "cons": 20.0, "kit": "DEPILAÇÃO", "pg": "CRÉDITO"},
    ],
    "phone": "(11) 91234-5678", "email": "silvia.pachikoski@example.com", "birth": "1975-10-20", "cpf": "098.765.432-11", "address": "Av. Brasil, 456", "city": "São Paulo", "indication": "Amiga", "skin_type": "seca", "allergies": "Ácido salicílico", "obs": "Sensibilidade alta", "status": "ativo", "score": "A"
  },
  {
    "id": "PAC0003", "name": "LIVIA MORANO BONFIM", "ltv": 65236.24, "liq": 48559.83, "cons": 12036.4, "n_tx": 16, "first_visit": "2024-01", "last_visit": "2025-06", "top_kit": "FIRMEZA & CONTORNO",
    "kits": ["PELE & REJUVENESCIMENTO", "FIRMEZA & CONTORNO", "LIFTING PREMIUM", "DEPILAÇÃO", "CAPILAR", "OUTROS"],
    "txs": [
      {"ym": "2025-06", "proc": "DERMA V ROXINHO PÓS PROCEDIMENTO", "cob": 0.0, "liq": 0.0, "cons": 50.0, "kit": "PELE & REJUVENESCIMENTO", "pg": "CORTESIA"}
    ],
    "phone": "", "email": "", "birth": "", "cpf": "", "address": "", "city": "", "indication": "", "skin_type": "normal", "allergies": "", "obs": "", "status": "ativo", "score": "A"
  },
  {
    "id": "PAC0004", "name": "ANA CAROLINA DE SOUSA WEEGE", "ltv": 63153.0, "liq": 49055.67, "cons": 11474.17, "n_tx": 9, "first_visit": "2024-03", "last_visit": "2025-10", "top_kit": "LIFTING PREMIUM",
    "kits": ["DEPILAÇÃO", "PELE & REJUVENESCIMENTO", "LIFTING PREMIUM", "FIRMEZA & CONTORNO"],
    "txs": [
      {"ym": "2025-10", "proc": "BUÇO + QUEIXO", "cob": 432.0, "liq": 373.576, "cons": 50.0, "kit": "DEPILAÇÃO", "pg": "CRÉDITO"}
    ],
    "phone": "", "email": "", "birth": "", "cpf": "", "address": "", "city": "", "indication": "", "skin_type": "oleosa", "allergies": "", "obs": "", "status": "ativo", "score": "A"
  },
  {
    "id": "PAC0005", "name": "ROSANE APARECIDA CARDOZO MORANO", "ltv": 62776.25, "liq": 43471.0, "cons": 6240.75, "n_tx": 6, "first_visit": "2024-03", "last_visit": "2025-04", "top_kit": "LIFTING PREMIUM",
    "kits": ["LIFTING PREMIUM", "FIRMEZA & CONTORNO"],
    "txs": [
      {"ym": "2025-04", "proc": "Oligio X - Full face", "cob": 6532.25, "liq": 0.0, "cons": 0.0, "kit": "LIFTING PREMIUM", "pg": "TED/PIX"}
    ],
    "phone": "", "email": "", "birth": "", "cpf": "", "address": "", "city": "", "indication": "", "skin_type": "", "allergies": "", "obs": "", "status": "ativo", "score": "A"
  },
  {
    "id": "PAC0006", "name": "GABRIELA VIEIRA BORGES", "ltv": 53837.5, "liq": 48381.0, "cons": 3436.9, "n_tx": 8, "first_visit": "2024-02", "last_visit": "2025-05", "top_kit": "FIRMEZA & CONTORNO",
    "kits": ["PELE & REJUVENESCIMENTO", "LIFTING PREMIUM", "FIRMEZA & CONTORNO"],
    "txs": [
      {"ym": "2025-05", "proc": "RED TOUCH FACE", "cob": 4500.0, "liq": 4412.25, "cons": 0.0, "kit": "LIFTING PREMIUM", "pg": "CRÉDITO"}
    ],
    "phone": "", "email": "", "birth": "", "cpf": "", "address": "", "city": "", "indication": "", "skin_type": "", "allergies": "", "obs": "", "status": "ativo", "score": "A"
  },
  {
    "id": "PAC0007", "name": "ERICO EVARISTO DE OLIVEIRA", "ltv": 51987.5, "liq": 47186.3, "cons": 5216.25, "n_tx": 4, "first_visit": "2024-01", "last_visit": "2025-08", "top_kit": "FIRMEZA & CONTORNO",
    "kits": ["LIFTING PREMIUM", "FIRMEZA & CONTORNO"],
    "txs": [
      {"ym": "2025-08", "proc": "3 RED TOUCH FULL FACE", "cob": 12750.0, "liq": 12750.0, "cons": 0.0, "kit": "LIFTING PREMIUM", "pg": "TED/PIX"}
    ],
    "phone": "", "email": "", "birth": "", "cpf": "", "address": "", "city": "", "indication": "", "skin_type": "", "allergies": "", "obs": "", "status": "ativo", "score": "A"
  },
  {
    "id": "PAC0008", "name": "Isabela Rochwerger Chacon", "ltv": 45004.5, "liq": 38210.5, "cons": 3545.0, "n_tx": 16, "first_visit": "2024-01", "last_visit": "2025-09", "top_kit": "DEPILAÇÃO",
    "kits": ["DEPILAÇÃO", "PELE & REJUVENESCIMENTO", "FIRMEZA & CONTORNO"],
    "txs": [
      {"ym": "2025-09", "proc": "Depilação Axila e Perna", "cob": 5166.0, "liq": 4786.0, "cons": 380.0, "kit": "FIRMEZA & CONTORNO", "pg": "TED/PIX"}
    ],
    "phone": "", "email": "", "birth": "", "cpf": "", "address": "", "city": "", "indication": "", "skin_type": "", "allergies": "", "obs": "", "status": "ativo", "score": "A"
  },
  {
    "id": "PAC0009", "name": "SOL MARIA GARCIA ESTRADA", "ltv": 44561.25, "liq": 36120.33, "cons": 7798.6, "n_tx": 5, "first_visit": "2024-03", "last_visit": "2024-11", "top_kit": "CAPILAR",
    "kits": ["CAPILAR", "LIFTING PREMIUM", "FIRMEZA & CONTORNO", "PELE & REJUVENESCIMENTO"],
    "txs": [
      {"ym": "2024-11", "proc": "V-Lifting - Full Face", "cob": 15277.5, "liq": 12489.5, "cons": 2788.0, "kit": "LIFTING PREMIUM", "pg": "TED/PIX"}
    ],
    "phone": "", "email": "", "birth": "", "cpf": "", "address": "", "city": "", "indication": "", "skin_type": "", "allergies": "", "obs": "", "status": "ativo", "score": "A"
  },
  {
    "id": "PAC0010", "name": "NATHALIA ALVERNAZ SPINELLI", "ltv": 43732.5, "liq": 37588.44, "cons": 6929.2, "n_tx": 7, "first_visit": "2024-06", "last_visit": "2025-04", "top_kit": "LIFTING PREMIUM",
    "kits": ["DEPILAÇÃO", "PELE & REJUVENESCIMENTO", "LIFTING PREMIUM", "FIRMEZA & CONTORNO"],
    "txs": [
      {"ym": "2025-03", "proc": "HYDRAFACIAL E 2 SESÕES RED TOUCH", "cob": 12000.0, "liq": 11025.0, "cons": 975.0, "kit": "LIFTING PREMIUM", "pg": "TED/PIX"}
    ],
    "phone": "", "email": "", "birth": "", "cpf": "", "address": "", "city": "", "indication": "", "skin_type": "", "allergies": "", "obs": "", "status": "ativo", "score": "A"
  }
];

export const KIT_ORDER = ['LIFTING PREMIUM','FIRMEZA & CONTORNO','PELE & REJUVENESCIMENTO','CAPILAR','DEPILAÇÃO','INJETÁVEIS & SKINCARE','OUTROS'];

export const DASH = {
  months: ["2024-01", "2024-02", "2024-03", "2024-04", "2024-05", "2024-06", "2024-07", "2024-08", "2024-09", "2024-10", "2024-11", "2024-12", "2025-01", "2025-02", "2025-03", "2025-04", "2025-05", "2025-06", "2025-07", "2025-08", "2025-09", "2025-10"],
  monthly: {
    "2024-01": {"cob": 88820.8, "liq": 69701.36, "cons": 11791.2, "n": 23, "ticket": 3861.77},
    "2024-02": {"cob": 127015.55, "liq": 108119.0, "cons": 16480.45, "n": 32, "ticket": 3969.24},
    "2024-03": {"cob": 229072.85, "liq": 200821.86, "cons": 23935.41, "n": 49, "ticket": 4674.96},
    "2024-04": {"cob": 212713.86, "liq": 173902.42, "cons": 23874.89, "n": 49, "ticket": 4341.10},
    "2024-05": {"cob": 80279.09, "liq": 64230.39, "cons": 10127.82, "n": 34, "ticket": 2361.15},
    "2024-06": {"cob": 148628.75, "liq": 125251.73, "cons": 17594.35, "n": 48, "ticket": 3096.43},
    "2024-07": {"cob": 132137.75, "liq": 112987.45, "cons": 16523.69, "n": 43, "ticket": 3072.97},
    "2024-08": {"cob": 124520.5, "liq": 107167.72, "cons": 17581.71, "n": 37, "ticket": 3365.42},
    "2024-09": {"cob": 128281.0, "liq": 105601.43, "cons": 19560.25, "n": 36, "ticket": 3563.36},
    "2024-10": {"cob": 184121.75, "liq": 145495.42, "cons": 31966.51, "n": 37, "ticket": 4976.26},
    "2024-11": {"cob": 266794.7, "liq": 209242.54, "cons": 43083.76, "n": 41, "ticket": 6507.19},
    "2024-12": {"cob": 206703.3, "liq": 166606.0, "cons": 33094.0, "n": 45, "ticket": 4593.41},
    "2025-01": {"cob": 79676.0, "liq": 63682.76, "cons": 12403.63, "n": 16, "ticket": 4979.75},
    "2025-02": {"cob": 155423.0, "liq": 130543.1, "cons": 22508.6, "n": 42, "ticket": 3700.55},
    "2025-03": {"cob": 188251.75, "liq": 152928.49, "cons": 23221.25, "n": 34, "ticket": 5536.82},
    "2025-04": {"cob": 146817.25, "liq": 117852.57, "cons": 23918.49, "n": 32, "ticket": 4588.04},
    "2025-05": {"cob": 150438.5, "liq": 127317.4, "cons": 18689.1, "n": 35, "ticket": 4298.24},
    "2025-06": {"cob": 56135.25, "liq": 51857.69, "cons": 3590.0, "n": 21, "ticket": 2673.11},
    "2025-07": {"cob": 82558.4, "liq": 67857.95, "cons": 13032.25, "n": 31, "ticket": 2663.17},
    "2025-08": {"cob": 123381.25, "liq": 104383.23, "cons": 16554.2, "n": 30, "ticket": 4112.71},
    "2025-09": {"cob": 164788.25, "liq": 133679.06, "cons": 25951.15, "n": 34, "ticket": 4846.71},
    "2025-10": {"cob": 138246.0, "liq": 108640.17, "cons": 27419.15, "n": 30, "ticket": 4608.20}
  },
  kit_data: {
    "INJETÁVEIS & SKINCARE": { "cob": 6835.5, "liq": 944.28, "n": 1, "cons": 0.0 },
    "FIRMEZA & CONTORNO": { "cob": 1021329.19, "liq": 834678.94, "n": 163, "cons": 141441.79 },
    "PELE & REJUVENESCIMENTO": { "cob": 662075.56, "liq": 581023.24, "n": 348, "cons": 60424.0 },
    "LIFTING PREMIUM": { "cob": 1051447.2, "liq": 858659.97, "n": 95, "cons": 151887.54 },
    "DEPILAÇÃO": { "cob": 186790.85, "liq": 162765.63, "n": 113, "cons": 15874.0 },
    "CAPILAR": { "cob": 225836.5, "liq": 154685.26, "n": 30, "cons": 61502.0 },
    "OUTROS": { "cob": 60490.75, "liq": 55112.4, "n": 29, "cons": 4789.0 }
  },
  kit_monthly: {
    "LIFTING PREMIUM": {"2024-01": 9630.0, "2024-02": 11599.5, "2024-03": 41181.0, "2024-04": 31064.5, "2024-08": 36681.5, "2024-09": 36875.0, "2024-10": 69617.0, "2024-11": 115535.5, "2024-12": 122976.3, "2025-01": 43686.5, "2025-02": 45596.75, "2025-03": 78095.25, "2025-04": 51460.75, "2025-05": 114800.5, "2025-06": 36815.75, "2025-07": 8409.65, "2025-08": 34464.0, "2025-09": 74669.25, "2025-10": 88288.5},
    "FIRMEZA & CONTORNO": {"2024-01": 36785.5, "2024-02": 60445.0, "2024-03": 115033.6, "2024-04": 128257.8, "2024-05": 37579.09, "2024-06": 86358.0, "2024-07": 63236.25, "2024-08": 39523.0, "2024-09": 44848.0, "2024-10": 54032.0, "2024-11": 84311.2, "2024-12": 52108.5, "2025-01": 14992.0, "2025-02": 27917.0, "2025-03": 18770.0, "2025-04": 45316.5, "2025-05": 11115.5, "2025-07": 25444.5, "2025-08": 35685.75, "2025-09": 39570.0},
    "PELE & REJUVENESCIMENTO": {"2024-01": 6250.0, "2024-02": 26398.75, "2024-03": 44222.0, "2024-04": 40381.56, "2024-05": 38791.5, "2024-06": 44336.75, "2024-07": 33118.5, "2024-08": 40818.0, "2024-09": 32201.25, "2024-10": 43625.75, "2024-11": 50324.0, "2024-12": 24811.5, "2025-01": 5202.5, "2025-02": 39070.0, "2025-03": 59275.5, "2025-04": 21503.0, "2025-05": 10966.0, "2025-06": 13716.0, "2025-07": 17480.25, "2025-08": 16725.5, "2025-09": 32153.5, "2025-10": 20703.75},
    "DEPILAÇÃO": {"2024-01": 9940.8, "2024-02": 15026.8, "2024-03": 7360.5, "2024-04": 12345.0, "2024-06": 4662.0, "2024-07": 16640.5, "2024-08": 7033.0, "2024-09": 3787.0, "2024-10": 5867.0, "2024-11": 4889.0, "2024-12": 6807.0, "2025-01": 3015.0, "2025-02": 23325.25, "2025-03": 17611.0, "2025-04": 3921.0, "2025-05": 11429.0, "2025-06": 835.0, "2025-07": 10609.0, "2025-08": 9004.5, "2025-09": 8395.5, "2025-10": 4287.0},
    "CAPILAR": {"2024-01": 13865.0, "2024-02": 11735.0, "2024-03": 15842.25, "2024-05": 418.5, "2024-06": 3735.0, "2024-07": 12192.5, "2024-09": 9974.75, "2024-10": 10561.5, "2024-11": 11735.0, "2025-01": 12780.0, "2025-02": 17921.0, "2025-03": 14500.0, "2025-04": 23396.25, "2025-05": 465.0, "2025-07": 20615.0, "2025-08": 25051.5, "2025-10": 21048.25},
    "OUTROS": {"2024-01": 5514.0, "2024-02": 1810.5, "2024-03": 5433.5, "2024-04": 665.0, "2024-05": 3490.0, "2024-06": 9537.0, "2024-07": 6950.0, "2024-08": 465.0, "2024-09": 595.0, "2024-10": 418.5, "2025-02": 1593.0, "2025-04": 1219.75, "2025-05": 1662.5, "2025-06": 4768.5, "2025-08": 2450.0, "2025-09": 10000.0, "2025-10": 3918.5}
  },
  pat_list: [
    {"name": "Carla Elaine Antonio Prado Troyjo", "cob": 121925.0, "liq": 94139.98, "n": 26, "kits": 5},
    {"name": "Silvia Rodrigues Pachikoski", "cob": 102675.6, "liq": 83096.75, "n": 15, "kits": 6},
    {"name": "LIVIA MORANO BONFIM", "cob": 65236.24, "liq": 48559.83, "n": 16, "kits": 6},
    {"name": "ANA CAROLINA DE SOUSA WEEGE", "cob": 63153.0, "liq": 49055.67, "n": 9, "kits": 4},
    {"name": "ROSANE APARECIDA CARDOZO MORANO", "cob": 62776.25, "liq": 43471.0, "n": 6, "kits": 2},
    {"name": "GABRIELA VIEIRA BORGES", "cob": 53837.5, "liq": 48381.0, "n": 8, "kits": 3},
    {"name": "ERICO EVARISTO DE OLIVEIRA", "cob": 51987.5, "liq": 47186.3, "n": 4, "kits": 2},
    {"name": "Isabela Rochwerger Chacon", "cob": 45004.5, "liq": 38210.5, "n": 16, "kits": 3},
    {"name": "SOL MARIA GARCIA ESTRADA", "cob": 44561.25, "liq": 36120.33, "n": 5, "kits": 4},
    {"name": "NATHALIA ALVERNAZ SPINELLI", "cob": 43732.5, "liq": 37588.44, "n": 7, "kits": 4},
    {"name": "VALENTINA SILAMI TUMA", "cob": 43144.0, "liq": 35017.15, "n": 9, "kits": 2},
    {"name": "Rosely Kasumi Fugita Yamaniski", "cob": 40689.0, "liq": 30417.39, "n": 4, "kits": 2},
    {"name": "BRUNA FERIGOTTI CORDEIRO GUERRA", "cob": 40536.7, "liq": 31699.01, "n": 7, "kits": 3},
    {"name": "ANDREIA CRISTINA BEZERRA CASQUET", "cob": 40251.25, "liq": 33070.0, "n": 5, "kits": 4},
    {"name": "MILENA COIMBRA MAZINI", "cob": 38079.5, "liq": 34788.17, "n": 8, "kits": 3}
  ],
  terms: [
    ["CLARITY", 189], ["FACE", 342], ["AXILA", 162], ["BUÇO", 146], ["PERNA", 126], ["DEPILAÇÃO", 105], ["INTIMA", 78], ["LIFTERA", 76], ["PESCOÇO", 73], ["VIRILHA", 68], ["OLHOS", 64], ["ULTRA FACE/ULTRAFORMER", 57]
  ],
  pg_data: {
    "CRÉDITO 2-6X": 736234.95,
    "CRÉDITO 7-12X": 975730.05,
    "TED/PIX": 798899.04,
    "CRÉDITO À VISTA": 562205.01,
    "DÉBITO": 26944.5
  },
  anomalies: {
    "cortesias": [
      {"ym":"2024-08","sheet":"AGO 24","paciente":"LETICIA DE ALMEIDA BALTAZAR","proc":"LIFTERA FULL FACE (VOUCHER)","cob":0.0,"cons":839.19,"liq":6685.81,"pg":"CORTESIA","kit":"FIRMEZA & CONTORNO"}
    ],
    "alto_cons": [],
    "high_ticket": [],
    "low_margin": []
  },
  totals: {
    "cob": 3214805.55,
    "liq": 2667920.04,
    "cons": 452901.86,
    "n": 779,
    "pacientes": 291,
    "ticket_medio": 4126.84
  },
  tx_all: [
    {"ym": "2024-01", "sheet": "JANEIRO 24", "paciente": "VICTORIA RAMALHO SCHWARZ", "proc": "motus/ sculptra / botox", "cob": 6835.5, "cons": 0.0, "liq": 944.28, "pg": "CRÉDITO 2 A 6X", "kit": "INJETÁVEIS & SKINCARE"}
  ]
};
