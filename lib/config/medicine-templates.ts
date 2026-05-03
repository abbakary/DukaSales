export interface MedicineTemplate {
  name: string;
  genericName: string;
  categoryName: string;
  dosage: string;
  form: string;
  unit: string;
  unitsPerPack: number;
  requiresPrescription: boolean;
}

export const TANZANIA_MEDICINE_TEMPLATES: MedicineTemplate[] = [
  {
    name: "Panadol (Paracetamol)",
    genericName: "Paracetamol",
    categoryName: "Analgesics & Antipyretics",
    dosage: "500mg",
    form: "tablet",
    unit: "strip",
    unitsPerPack: 10,
    requiresPrescription: false
  },
  {
    name: "Amoxy-Care (Amoxicillin)",
    genericName: "Amoxicillin",
    categoryName: "Antibiotics",
    dosage: "500mg",
    form: "capsule",
    unit: "strip",
    unitsPerPack: 10,
    requiresPrescription: true
  },
  {
    name: "Malu-1 (AL)",
    genericName: "Artemether 20mg + Lumefantrine 120mg",
    categoryName: "Anti-Malarials",
    dosage: "20/120mg",
    form: "tablet",
    unit: "box",
    unitsPerPack: 24,
    requiresPrescription: false
  },
  {
    name: "Flagyl (Metronidazole)",
    genericName: "Metronidazole",
    categoryName: "Antiprotozoal",
    dosage: "400mg",
    form: "tablet",
    unit: "strip",
    unitsPerPack: 10,
    requiresPrescription: true
  },
  {
    name: "Cipro-Care (Ciprofloxacin)",
    genericName: "Ciprofloxacin",
    categoryName: "Antibiotics",
    dosage: "500mg",
    form: "tablet",
    unit: "strip",
    unitsPerPack: 10,
    requiresPrescription: true
  },
  {
    name: "Diclo-Plus (Diclofenac)",
    genericName: "Diclofenac Sodium",
    categoryName: "Anti-Inflammatory",
    dosage: "50mg",
    form: "tablet",
    unit: "strip",
    unitsPerPack: 10,
    requiresPrescription: false
  },
  {
    name: "Omeprazole",
    genericName: "Omeprazole",
    categoryName: "Antacids & Anti-ulcerants",
    dosage: "20mg",
    form: "capsule",
    unit: "strip",
    unitsPerPack: 10,
    requiresPrescription: false
  },
  {
    name: "Cetirizine",
    genericName: "Cetirizine Hydrochloride",
    categoryName: "Antihistamines",
    dosage: "10mg",
    form: "tablet",
    unit: "strip",
    unitsPerPack: 10,
    requiresPrescription: false
  },
  {
    name: "Azithromycin",
    genericName: "Azithromycin",
    categoryName: "Antibiotics",
    dosage: "500mg",
    form: "tablet",
    unit: "box",
    unitsPerPack: 3,
    requiresPrescription: true
  },
  {
    name: "Ventolin (Salbutamol)",
    genericName: "Salbutamol",
    categoryName: "Respiratory (Asthma)",
    dosage: "100mcg",
    form: "inhaler",
    unit: "bottle",
    unitsPerPack: 1,
    requiresPrescription: true
  },
  {
    name: "Metformin",
    genericName: "Metformin Hydrochloride",
    categoryName: "Anti-Diabetic",
    dosage: "500mg",
    form: "tablet",
    unit: "strip",
    unitsPerPack: 10,
    requiresPrescription: true
  },
  {
    name: "Amlodipine",
    genericName: "Amlodipine Besylate",
    categoryName: "Anti-Hypertensive",
    dosage: "5mg",
    form: "tablet",
    unit: "strip",
    unitsPerPack: 10,
    requiresPrescription: true
  },
  {
    name: "Ibuprofen",
    genericName: "Ibuprofen",
    categoryName: "Analgesics & Anti-Inflammatory",
    dosage: "400mg",
    form: "tablet",
    unit: "strip",
    unitsPerPack: 10,
    requiresPrescription: false
  },
  {
    name: "Piriton (Chlorpheniramine)",
    genericName: "Chlorpheniramine Maleate",
    categoryName: "Antihistamines",
    dosage: "4mg",
    form: "tablet",
    unit: "strip",
    unitsPerPack: 10,
    requiresPrescription: false
  },
  {
    name: "Zentel (Albendazole)",
    genericName: "Albendazole",
    categoryName: "Anthelmintics (Deworming)",
    dosage: "400mg",
    form: "tablet",
    unit: "piece",
    unitsPerPack: 1,
    requiresPrescription: false
  },
  {
    name: "Doxycycline",
    genericName: "Doxycycline Hyclate",
    categoryName: "Antibiotics",
    dosage: "100mg",
    form: "capsule",
    unit: "strip",
    unitsPerPack: 10,
    requiresPrescription: true
  },
  {
    name: "Prednisolone",
    genericName: "Prednisolone",
    categoryName: "Corticosteroids",
    dosage: "5mg",
    form: "tablet",
    unit: "strip",
    unitsPerPack: 10,
    requiresPrescription: true
  },
  {
    name: "Glibenclamide",
    genericName: "Glibenclamide",
    categoryName: "Anti-Diabetic",
    dosage: "5mg",
    form: "tablet",
    unit: "strip",
    unitsPerPack: 10,
    requiresPrescription: true
  },
  {
    name: "Dulcolax (Bisacodyl)",
    genericName: "Bisacodyl",
    categoryName: "Laxatives",
    dosage: "5mg",
    form: "tablet",
    unit: "strip",
    unitsPerPack: 10,
    requiresPrescription: false
  },
  {
    name: "ORS (Oral Rehydration Salts)",
    genericName: "ORS",
    categoryName: "Rehydration",
    dosage: "20.5g",
    form: "sachet",
    unit: "sachet",
    unitsPerPack: 1,
    requiresPrescription: false
  },
  {
    name: "Zinc Sulfate",
    genericName: "Zinc Sulfate",
    categoryName: "Supplements",
    dosage: "20mg",
    form: "tablet",
    unit: "strip",
    unitsPerPack: 10,
    requiresPrescription: false
  },
  {
    name: "Canesten (Clotrimazole)",
    genericName: "Clotrimazole",
    categoryName: "Anti-Fungal",
    dosage: "1%",
    form: "cream",
    unit: "tube",
    unitsPerPack: 1,
    requiresPrescription: false
  },
  {
    name: "Hydrocortisone",
    genericName: "Hydrocortisone",
    categoryName: "Corticosteroids (Topical)",
    dosage: "1%",
    form: "cream",
    unit: "tube",
    unitsPerPack: 1,
    requiresPrescription: false
  },
  {
    name: "Vitamin B Complex",
    genericName: "Vitamin B Complex",
    categoryName: "Vitamins",
    dosage: "Standard",
    form: "tablet",
    unit: "strip",
    unitsPerPack: 10,
    requiresPrescription: false
  },
  {
    name: "Folic Acid",
    genericName: "Folic Acid",
    categoryName: "Supplements",
    dosage: "5mg",
    form: "tablet",
    unit: "strip",
    unitsPerPack: 10,
    requiresPrescription: false
  },
  {
    name: "Ferrous Sulfate",
    genericName: "Ferrous Sulfate",
    categoryName: "Supplements (Iron)",
    dosage: "200mg",
    form: "tablet",
    unit: "strip",
    unitsPerPack: 10,
    requiresPrescription: false
  }
];
