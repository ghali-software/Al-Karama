"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Pencil,
  Save,
  X,
  ArrowRight,
  User,
  CreditCard,
  Phone,
  MapPin,
  Baby,
  Calendar,
  Stethoscope,
  HandHeart,
} from "lucide-react";
import type { Patient, MedicalRecord, AidRecord } from "@/types";

export default function PatientDetailPage() {
  const t = useTranslations();
  const params = useParams();
  const router = useRouter();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [aidRecords, setAidRecords] = useState<AidRecord[]>([]);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    age: "",
    sex: "",
    cin: "",
    phone: "",
    city: "",
    address: "",
    is_child: false,
    guardian_name: "",
    number_of_children: "",
    youngest_child_age: "",
  });

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();
      const id = params.id as string;

      const [{ data: patientData }, { data: medData }, { data: aidData }] =
        await Promise.all([
          supabase.from("patients").select("*").eq("id", id).single(),
          supabase
            .from("medical_records")
            .select("*")
            .eq("patient_id", id)
            .order("created_at", { ascending: false }),
          supabase
            .from("aid_records")
            .select("*")
            .eq("patient_id", id)
            .order("created_at", { ascending: false }),
        ]);

      setPatient(patientData);
      setMedicalRecords(medData || []);
      setAidRecords(aidData || []);

      if (patientData) {
        setForm({
          first_name: patientData.first_name || "",
          last_name: patientData.last_name || "",
          age: patientData.age != null ? String(patientData.age) : "",
          sex: patientData.sex || "",
          cin: patientData.cin || "",
          phone: patientData.phone || "",
          city: patientData.city || "",
          address: patientData.address || "",
          is_child: patientData.is_child || false,
          guardian_name: patientData.guardian_name || "",
          number_of_children:
            patientData.number_of_children != null
              ? String(patientData.number_of_children)
              : "",
          youngest_child_age: patientData.youngest_child_age || "",
        });
      }
    }
    fetchData();
  }, [params.id]);

  async function handleSave() {
    if (!patient) return;
    setSaving(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("patients")
      .update({
        first_name: form.first_name,
        last_name: form.last_name,
        age: form.age ? Number(form.age) : null,
        sex: form.sex || null,
        cin: form.cin || null,
        phone: form.phone || null,
        city: form.city || null,
        address: form.address || null,
        is_child: form.is_child,
        guardian_name: form.guardian_name || null,
        number_of_children: form.number_of_children
          ? Number(form.number_of_children)
          : null,
        youngest_child_age: form.youngest_child_age || null,
      })
      .eq("id", patient.id)
      .select()
      .single();

    if (!error && data) {
      setPatient(data);
      setEditing(false);
    }
    setSaving(false);
  }

  function handleCancel() {
    if (patient) {
      setForm({
        first_name: patient.first_name || "",
        last_name: patient.last_name || "",
        age: patient.age != null ? String(patient.age) : "",
        sex: patient.sex || "",
        cin: patient.cin || "",
        phone: patient.phone || "",
        city: patient.city || "",
        address: patient.address || "",
        is_child: patient.is_child || false,
        guardian_name: patient.guardian_name || "",
        number_of_children:
          patient.number_of_children != null
            ? String(patient.number_of_children)
            : "",
        youngest_child_age: patient.youngest_child_age || "",
      });
    }
    setEditing(false);
  }

  if (!patient) {
    return (
      <div className="space-y-6 max-w-[1000px]">
        <div className="h-8 w-48 rounded-lg bg-muted animate-pulse" />
        <div className="h-64 rounded-2xl bg-muted/40 animate-pulse" />
        <div className="h-40 rounded-2xl bg-muted/40 animate-pulse" />
      </div>
    );
  }

  const initials = `${(patient.first_name || "?")[0]}${(patient.last_name || "?")[0]}`;

  // Info field component for view mode
  const InfoField = ({
    icon: Icon,
    label,
    value,
    dir,
  }: {
    icon: typeof User;
    label: string;
    value: string | number | null | undefined;
    dir?: string;
  }) => (
    <div className="flex items-start gap-3 py-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/60">
        <Icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.8} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground/70 font-medium">
          {label}
        </p>
        <p
          className="text-[14px] font-medium text-foreground mt-0.5 truncate"
          dir={dir}
        >
          {value || "-"}
        </p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-[1000px]">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowRight className="h-4 w-4 rotate-180" />
        {t("common.back")}
      </button>

      {/* Patient Header */}
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary text-lg font-bold">
          {initials}
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight" dir="auto">
            {patient.first_name} {patient.last_name}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            {patient.age && (
              <Badge
                variant="secondary"
                className="text-[11px] font-medium rounded-lg"
              >
                {patient.age} ans
              </Badge>
            )}
            {patient.sex && (
              <Badge
                variant="secondary"
                className="text-[11px] font-medium rounded-lg"
              >
                {patient.sex === "M"
                  ? t("patients.male")
                  : t("patients.female")}
              </Badge>
            )}
            {patient.cin && (
              <Badge
                variant="outline"
                className="text-[11px] font-mono rounded-lg"
              >
                {patient.cin}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Patient Info Card */}
      <div className="rounded-2xl border border-border/60 bg-white overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/40">
          <h2 className="text-sm font-semibold">{t("patients.title")}</h2>
          {editing ? (
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                className="gap-1.5 text-[13px]"
              >
                <X className="h-3.5 w-3.5" />
                {t("patients.cancelEdit")}
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving}
                className="gap-1.5 text-[13px] rounded-xl"
              >
                <Save className="h-3.5 w-3.5" />
                {t("patients.saveInfo")}
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditing(true)}
              className="gap-1.5 text-[13px] rounded-xl"
            >
              <Pencil className="h-3.5 w-3.5" />
              {t("patients.editInfo")}
            </Button>
          )}
        </div>

        {editing ? (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
              <div className="space-y-1.5">
                <Label className="text-[12px] text-muted-foreground">
                  {t("patients.firstName")}
                </Label>
                <Input
                  value={form.first_name}
                  onChange={(e) =>
                    setForm({ ...form, first_name: e.target.value })
                  }
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[12px] text-muted-foreground">
                  {t("patients.lastName")}
                </Label>
                <Input
                  value={form.last_name}
                  onChange={(e) =>
                    setForm({ ...form, last_name: e.target.value })
                  }
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[12px] text-muted-foreground">
                  {t("patients.age")}
                </Label>
                <Input
                  type="number"
                  value={form.age}
                  onChange={(e) => setForm({ ...form, age: e.target.value })}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[12px] text-muted-foreground">
                  {t("patients.sex")}
                </Label>
                <Select
                  value={form.sex}
                  onValueChange={(v) => setForm({ ...form, sex: v ?? "" })}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">{t("patients.male")}</SelectItem>
                    <SelectItem value="F">{t("patients.female")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[12px] text-muted-foreground">
                  {t("patients.cin")}
                </Label>
                <Input
                  value={form.cin}
                  onChange={(e) => setForm({ ...form, cin: e.target.value })}
                  dir="ltr"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[12px] text-muted-foreground">
                  {t("patients.phone")}
                </Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  dir="ltr"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[12px] text-muted-foreground">
                  {t("patients.city")}
                </Label>
                <Input
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[12px] text-muted-foreground">
                  {t("patients.address")}
                </Label>
                <Input
                  value={form.address}
                  onChange={(e) =>
                    setForm({ ...form, address: e.target.value })
                  }
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[12px] text-muted-foreground">
                  {t("patients.numberOfChildren")}
                </Label>
                <Input
                  type="number"
                  value={form.number_of_children}
                  onChange={(e) =>
                    setForm({ ...form, number_of_children: e.target.value })
                  }
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[12px] text-muted-foreground">
                  {t("patients.youngestChildAge")}
                </Label>
                <Input
                  value={form.youngest_child_age}
                  onChange={(e) =>
                    setForm({ ...form, youngest_child_age: e.target.value })
                  }
                  className="rounded-xl"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="px-6 pb-2">
            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-border/30 rtl:divide-x-reverse">
              <InfoField
                icon={Calendar}
                label={t("patients.age")}
                value={patient.age ? `${patient.age} ans` : null}
              />
              <InfoField
                icon={User}
                label={t("patients.sex")}
                value={
                  patient.sex === "M"
                    ? t("patients.male")
                    : patient.sex === "F"
                      ? t("patients.female")
                      : null
                }
              />
              <InfoField
                icon={CreditCard}
                label={t("patients.cin")}
                value={patient.cin}
                dir="ltr"
              />
              <InfoField
                icon={Phone}
                label={t("patients.phone")}
                value={patient.phone}
                dir="ltr"
              />
            </div>
            <div className="border-t border-border/30" />
            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-border/30 rtl:divide-x-reverse">
              <InfoField
                icon={MapPin}
                label={t("patients.city")}
                value={patient.city}
              />
              <InfoField
                icon={MapPin}
                label={t("patients.address")}
                value={patient.address}
              />
              <InfoField
                icon={Baby}
                label={t("patients.numberOfChildren")}
                value={patient.number_of_children}
              />
              <InfoField
                icon={Baby}
                label={t("patients.youngestChildAge")}
                value={patient.youngest_child_age}
              />
            </div>
          </div>
        )}
      </div>

      {/* Medical Records */}
      <div className="rounded-2xl border border-border/60 bg-white overflow-hidden">
        <div className="px-6 py-4 border-b border-border/40">
          <div className="flex items-center gap-2">
            <Stethoscope
              className="h-4 w-4 text-primary"
              strokeWidth={1.8}
            />
            <h2 className="text-sm font-semibold">
              {t("patients.medicalRecords")}
            </h2>
          </div>
        </div>
        {medicalRecords.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <Stethoscope className="h-8 w-8 mx-auto text-muted-foreground/20 mb-2" />
            <p className="text-sm text-muted-foreground">
              {t("common.noResults")}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {medicalRecords.map((record) => (
              <div
                key={record.id}
                className="grid grid-cols-2 md:grid-cols-5 gap-4 px-6 py-3 hover:bg-muted/20 transition-colors"
              >
                <div>
                  <p className="text-[11px] text-muted-foreground">
                    {t("common.date")}
                  </p>
                  <p className="text-[13px] font-medium">
                    {new Date(record.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">
                    {t("medical.diagnosis")}
                  </p>
                  <p className="text-[13px] font-medium">
                    {record.diagnosis || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">
                    {t("medical.treatment")}
                  </p>
                  <p className="text-[13px] font-medium">
                    {record.treatment || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">
                    {t("medical.bloodPressure")}
                  </p>
                  <p className="text-[13px] font-medium" dir="ltr">
                    {record.blood_pressure || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">
                    {t("medical.weight")}
                  </p>
                  <p className="text-[13px] font-medium">
                    {record.weight ? `${record.weight} kg` : "-"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Aid Records */}
      <div className="rounded-2xl border border-border/60 bg-white overflow-hidden">
        <div className="px-6 py-4 border-b border-border/40">
          <div className="flex items-center gap-2">
            <HandHeart className="h-4 w-4 text-primary" strokeWidth={1.8} />
            <h2 className="text-sm font-semibold">
              {t("patients.aidRecords")}
            </h2>
          </div>
        </div>
        {aidRecords.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <HandHeart className="h-8 w-8 mx-auto text-muted-foreground/20 mb-2" />
            <p className="text-sm text-muted-foreground">
              {t("common.noResults")}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {aidRecords.map((record) => (
              <div
                key={record.id}
                className="grid grid-cols-2 md:grid-cols-5 gap-4 px-6 py-3 hover:bg-muted/20 transition-colors"
              >
                <div>
                  <p className="text-[11px] text-muted-foreground">
                    {t("common.date")}
                  </p>
                  <p className="text-[13px] font-medium">
                    {new Date(record.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">
                    {t("aid.type")}
                  </p>
                  <Badge variant="secondary" className="text-[11px] rounded-lg mt-0.5">
                    {t(
                      `aid.${record.aid_type}` as
                        | "aid.medication"
                        | "aid.glasses"
                        | "aid.consultation"
                        | "aid.surgery"
                        | "aid.dental"
                        | "aid.other"
                    )}
                  </Badge>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">
                    {t("aid.description")}
                  </p>
                  <p className="text-[13px] font-medium">
                    {record.description || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">
                    {t("aid.quantity")}
                  </p>
                  <p className="text-[13px] font-medium">{record.quantity}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">
                    {t("aid.totalCost")}
                  </p>
                  <p className="text-[13px] font-medium">
                    {record.total_cost ? `${record.total_cost} MAD` : "-"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
