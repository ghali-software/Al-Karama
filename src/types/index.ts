export type AidType =
  | "medication"
  | "glasses"
  | "consultation"
  | "surgery"
  | "dental"
  | "other";

export type CaravanStatus = "planned" | "active" | "completed";

export type UserRole = "admin" | "doctor" | "member";

export interface Profile {
  id: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
}

export interface Caravan {
  id: string;
  name: string;
  location: string;
  region: string | null;
  date_start: string;
  date_end: string | null;
  doctor_name: string | null;
  specialty: string | null;
  status: CaravanStatus;
  notes: string | null;
  created_at: string;
  created_by: string | null;
}

export interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  age: number | null;
  sex: "M" | "F" | null;
  cin: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  is_child: boolean;
  guardian_name: string | null;
  guardian_cin: string | null;
  number_of_children: number | null;
  youngest_child_age: string | null;
  created_at: string;
}

export interface MedicalRecord {
  id: string;
  patient_id: string;
  caravan_id: string | null;
  blood_pressure: string | null;
  weight: number | null;
  height: number | null;
  temperature: number | null;
  diagnosis: string | null;
  treatment: string | null;
  medical_history: string | null;
  notes: string | null;
  created_at: string;
}

export interface AidRecord {
  id: string;
  patient_id: string;
  caravan_id: string | null;
  medical_record_id: string | null;
  aid_type: AidType;
  description: string | null;
  quantity: number;
  unit_cost: number | null;
  total_cost: number | null;
  created_at: string;
}

export interface OcrScan {
  id: string;
  image_url: string;
  raw_result: Record<string, unknown> | null;
  parsed_data: OcrParsedData | null;
  confidence_score: number | null;
  patient_id: string | null;
  medical_record_id: string | null;
  created_at: string;
  created_by: string | null;
}

export interface GeneratedReport {
  id: string;
  title: string;
  caravan_id: string | null;
  report_type: "caravan" | "monthly" | "annual" | "custom";
  file_url_pdf: string | null;
  file_url_docx: string | null;
  ai_analysis: string | null;
  parameters: Record<string, unknown> | null;
  created_at: string;
  created_by: string | null;
}

// OCR types
export interface OcrPatientData {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  age: number | null;
  sex: "M" | "F" | null;
  cin: string;
  phone: string;
  address: string;
  city: string;
  is_child: boolean;
  guardian_name: string;
  guardian_cin: string;
}

export interface OcrMedicalData {
  blood_pressure: string;
  weight: number | null;
  height: number | null;
  temperature: number | null;
  diagnosis: string;
  treatment: string;
  medical_history: string;
}

export interface OcrAidData {
  aid_type: AidType;
  description: string;
  quantity: number;
}

export interface OcrCaravanData {
  location: string;
  date: string;
  doctor_name: string;
  specialty: string;
}

export interface OcrParsedData {
  patient: OcrPatientData;
  medical: OcrMedicalData;
  aid: OcrAidData[];
  caravan: OcrCaravanData;
  confidence: number;
}

// Dashboard stats
export interface CaravanStats {
  id: string;
  name: string;
  location: string;
  date_start: string;
  total_patients: number;
  total_aids: number;
  total_cost: number;
}

export interface MonthlyStats {
  month: string;
  total_caravans: number;
  total_patients: number;
  total_cost: number;
}
