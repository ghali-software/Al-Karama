-- Ajout des colonnes enfants au tableau patients
-- Ces colonnes sont necessaires pour le registre manuscrit (عدد الأطفال / سن آخر طفل)

ALTER TABLE patients ADD COLUMN IF NOT EXISTS number_of_children INT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS youngest_child_age TEXT;
