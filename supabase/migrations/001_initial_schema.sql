-- Al Karama - Schema initial
-- Association caritative - Gestion des caravanes medicales

-- Enums
CREATE TYPE aid_type AS ENUM ('medication', 'glasses', 'consultation', 'surgery', 'dental', 'other');
CREATE TYPE caravan_status AS ENUM ('planned', 'active', 'completed');

-- Profils utilisateurs (extension de auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'doctor', 'member')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger pour creer un profil automatiquement a l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Caravanes medicales
CREATE TABLE caravans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  region TEXT,
  date_start DATE NOT NULL,
  date_end DATE,
  doctor_name TEXT,
  specialty TEXT,
  status caravan_status DEFAULT 'planned',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Patients / Beneficiaires
CREATE TABLE patients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE,
  age INT,
  sex TEXT CHECK (sex IN ('M', 'F')),
  cin TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  is_child BOOLEAN DEFAULT false,
  guardian_name TEXT,
  guardian_cin TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Dossiers medicaux
CREATE TABLE medical_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  caravan_id UUID REFERENCES caravans(id) ON DELETE SET NULL,
  blood_pressure TEXT,
  weight DECIMAL,
  height DECIMAL,
  temperature DECIMAL,
  diagnosis TEXT,
  treatment TEXT,
  medical_history TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Aide fournie
CREATE TABLE aid_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  caravan_id UUID REFERENCES caravans(id) ON DELETE SET NULL,
  medical_record_id UUID REFERENCES medical_records(id) ON DELETE SET NULL,
  aid_type aid_type NOT NULL,
  description TEXT,
  quantity INT DEFAULT 1,
  unit_cost DECIMAL,
  total_cost DECIMAL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Scans OCR (audit trail)
CREATE TABLE ocr_scans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  raw_result JSONB,
  parsed_data JSONB,
  confidence_score DECIMAL,
  patient_id UUID REFERENCES patients(id),
  medical_record_id UUID REFERENCES medical_records(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Rapports generes
CREATE TABLE generated_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  caravan_id UUID REFERENCES caravans(id),
  report_type TEXT CHECK (report_type IN ('caravan', 'monthly', 'annual', 'custom')),
  file_url_pdf TEXT,
  file_url_docx TEXT,
  ai_analysis TEXT,
  parameters JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Index pour les performances
CREATE INDEX idx_medical_records_patient ON medical_records(patient_id);
CREATE INDEX idx_medical_records_caravan ON medical_records(caravan_id);
CREATE INDEX idx_aid_records_patient ON aid_records(patient_id);
CREATE INDEX idx_aid_records_caravan ON aid_records(caravan_id);
CREATE INDEX idx_patients_cin ON patients(cin);
CREATE INDEX idx_caravans_status ON caravans(status);
CREATE INDEX idx_caravans_date ON caravans(date_start);

-- Vues pour le dashboard
CREATE VIEW v_caravan_stats AS
SELECT
  c.id,
  c.name,
  c.location,
  c.date_start,
  c.status,
  COUNT(DISTINCT mr.patient_id) AS total_patients,
  COUNT(ar.id) AS total_aids,
  COALESCE(SUM(ar.total_cost), 0) AS total_cost
FROM caravans c
LEFT JOIN medical_records mr ON mr.caravan_id = c.id
LEFT JOIN aid_records ar ON ar.caravan_id = c.id
GROUP BY c.id;

CREATE VIEW v_monthly_stats AS
SELECT
  DATE_TRUNC('month', c.date_start) AS month,
  COUNT(DISTINCT c.id) AS total_caravans,
  COUNT(DISTINCT mr.patient_id) AS total_patients,
  COALESCE(SUM(ar.total_cost), 0) AS total_cost
FROM caravans c
LEFT JOIN medical_records mr ON mr.caravan_id = c.id
LEFT JOIN aid_records ar ON ar.caravan_id = c.id
GROUP BY DATE_TRUNC('month', c.date_start)
ORDER BY month;

CREATE VIEW v_aid_by_category AS
SELECT
  ar.aid_type,
  COUNT(*) AS total_count,
  COALESCE(SUM(ar.total_cost), 0) AS total_cost
FROM aid_records ar
GROUP BY ar.aid_type;

CREATE VIEW v_patient_demographics AS
SELECT
  sex,
  is_child,
  COUNT(*) AS total
FROM patients
GROUP BY sex, is_child;

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE caravans ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE aid_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE ocr_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_reports ENABLE ROW LEVEL SECURITY;

-- Policies : tous les utilisateurs authentifies peuvent lire/ecrire
CREATE POLICY "Authenticated users can read profiles" ON profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Authenticated users full access to caravans" ON caravans
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users full access to patients" ON patients
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users full access to medical_records" ON medical_records
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users full access to aid_records" ON aid_records
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users full access to ocr_scans" ON ocr_scans
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users full access to generated_reports" ON generated_reports
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Storage bucket pour les uploads OCR et les rapports
INSERT INTO storage.buckets (id, name, public) VALUES ('ocr-uploads', 'ocr-uploads', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('reports', 'reports', false);

CREATE POLICY "Authenticated users can upload OCR files" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'ocr-uploads');

CREATE POLICY "Authenticated users can read OCR files" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'ocr-uploads');

CREATE POLICY "Authenticated users can upload reports" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'reports');

CREATE POLICY "Authenticated users can read reports" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'reports');
