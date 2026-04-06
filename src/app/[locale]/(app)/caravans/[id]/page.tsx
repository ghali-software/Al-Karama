"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatCard } from "@/components/dashboard/stat-card";
import {
  Users,
  HandHeart,
  DollarSign,
  Pencil,
  Save,
  X,
  Trash2,
  Loader2,
  Baby,
  CreditCard,
} from "lucide-react";
import type { Caravan, CaravanStatus } from "@/types";

const statusColors: Record<CaravanStatus, string> = {
  planned: "bg-blue-100 text-blue-800",
  active: "bg-green-100 text-green-800",
  completed: "bg-gray-100 text-gray-800",
};

interface CaravanPatient {
  id: string;
  first_name: string;
  last_name: string;
  age: number | null;
  sex: string | null;
  cin: string | null;
  number_of_children: number | null;
  youngest_child_age: string | null;
  diagnosis: string | null;
}

interface CaravanDetail extends Caravan {
  medical_records: {
    id: string;
    patient_id: string;
    diagnosis: string | null;
    patients: {
      id: string;
      first_name: string;
      last_name: string;
      age: number | null;
      sex: string | null;
      cin: string | null;
      number_of_children: number | null;
      youngest_child_age: string | null;
    } | null;
  }[];
  aid_records: {
    id: string;
    aid_type: string;
    description: string | null;
    quantity: number;
    total_cost: number | null;
  }[];
}

export default function CaravanDetailPage() {
  const t = useTranslations();
  const locale = useLocale();
  const params = useParams();
  const router = useRouter();
  const [caravan, setCaravan] = useState<CaravanDetail | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    location: "",
    region: "",
    date_start: "",
    date_end: "",
    doctor_name: "",
    specialty: "",
    status: "planned" as CaravanStatus,
    notes: "",
  });

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();
      const id = params.id as string;

      const { data } = await supabase
        .from("caravans")
        .select(
          `*, medical_records(id, patient_id, diagnosis, patients(id, first_name, last_name, age, sex, cin, number_of_children, youngest_child_age)), aid_records(id, aid_type, description, quantity, total_cost)`
        )
        .eq("id", id)
        .single();

      const c = data as unknown as CaravanDetail;
      setCaravan(c);

      if (c) {
        setForm({
          name: c.name || "",
          location: c.location || "",
          region: c.region || "",
          date_start: c.date_start || "",
          date_end: c.date_end || "",
          doctor_name: c.doctor_name || "",
          specialty: c.specialty || "",
          status: c.status || "planned",
          notes: c.notes || "",
        });
      }
    }

    fetchData();
  }, [params.id]);

  async function handleSave() {
    if (!caravan) return;
    setSaving(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("caravans")
      .update({
        name: form.name,
        location: form.location,
        region: form.region || null,
        date_start: form.date_start,
        date_end: form.date_end || null,
        doctor_name: form.doctor_name || null,
        specialty: form.specialty || null,
        status: form.status,
        notes: form.notes || null,
      })
      .eq("id", caravan.id)
      .select()
      .single();

    if (!error && data) {
      setCaravan((prev) => (prev ? { ...prev, ...data } : prev));
      setEditing(false);
    }
    setSaving(false);
  }

  function handleCancel() {
    if (caravan) {
      setForm({
        name: caravan.name || "",
        location: caravan.location || "",
        region: caravan.region || "",
        date_start: caravan.date_start || "",
        date_end: caravan.date_end || "",
        doctor_name: caravan.doctor_name || "",
        specialty: caravan.specialty || "",
        status: caravan.status || "planned",
        notes: caravan.notes || "",
      });
    }
    setEditing(false);
  }

  async function handleDelete() {
    if (!caravan) return;
    setDeleting(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("caravans")
      .delete()
      .eq("id", caravan.id);

    if (!error) {
      router.push(`/${locale}/caravans`);
    }
    setDeleting(false);
  }

  if (!caravan) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Build patients list from medical records
  const patientsMap = new Map<string, CaravanPatient>();
  (caravan.medical_records || []).forEach((r) => {
    if (r.patients && !patientsMap.has(r.patient_id)) {
      patientsMap.set(r.patient_id, {
        id: r.patients.id,
        first_name: r.patients.first_name,
        last_name: r.patients.last_name,
        age: r.patients.age,
        sex: r.patients.sex,
        cin: r.patients.cin,
        number_of_children: r.patients.number_of_children,
        youngest_child_age: r.patients.youngest_child_age,
        diagnosis: r.diagnosis,
      });
    }
  });
  const patientsList = Array.from(patientsMap.values());

  const totalCost = (caravan.aid_records || []).reduce(
    (sum, a) => sum + (Number(a.total_cost) || 0),
    0
  );
  const totalChildren = patientsList.reduce(
    (sum, p) => sum + (p.number_of_children || 0),
    0
  );
  const patientsWithAge = patientsList.filter((p) => p.age != null);
  const avgAge =
    patientsWithAge.length > 0
      ? Math.round(
          patientsWithAge.reduce((sum, p) => sum + (p.age || 0), 0) /
            patientsWithAge.length
        )
      : 0;
  const withCin = patientsList.filter((p) => p.cin).length;

  const statusLabel = (status: CaravanStatus) => {
    const map = {
      planned: t("caravans.statusPlanned"),
      active: t("caravans.statusActive"),
      completed: t("caravans.statusCompleted"),
    };
    return map[status];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">{caravan.name}</h1>
          <Badge className={statusColors[caravan.status]}>
            {statusLabel(caravan.status)}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <Button variant="outline" size="sm" onClick={handleCancel} className="gap-1">
                <X className="h-4 w-4" />
                {t("caravans.cancelEdit")}
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1">
                <Save className="h-4 w-4" />
                {t("caravans.saveCaravan")}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="gap-1">
                <Pencil className="h-4 w-4" />
                {t("caravans.editCaravan")}
              </Button>
              <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
                <DialogTrigger render={
                  <Button variant="destructive" size="sm" className="gap-1" />
                }>
                  <Trash2 className="h-4 w-4" />
                  {t("caravans.deleteCaravan")}
                </DialogTrigger>
                <DialogContent className="max-w-sm">
                  <DialogHeader>
                    <DialogTitle>{t("common.confirmDelete")}</DialogTitle>
                  </DialogHeader>
                  <p className="text-sm text-muted-foreground">
                    {t("caravans.confirmDeleteCaravan")}
                  </p>
                  <div className="flex justify-end gap-2 mt-4">
                    <Button variant="outline" onClick={() => setConfirmDeleteOpen(false)}>
                      {t("common.cancel")}
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDelete}
                      disabled={deleting}
                      className="gap-2"
                    >
                      {deleting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      {t("common.delete")}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </div>

      {/* Caravan Info */}
      <Card>
        <CardContent className="pt-6">
          {editing ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">{t("caravans.name")}</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">{t("caravans.location")}</Label>
                <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">{t("caravans.region")}</Label>
                <Input value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">{t("caravans.dateStart")}</Label>
                <Input type="date" value={form.date_start} onChange={(e) => setForm({ ...form, date_start: e.target.value })} dir="ltr" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">{t("caravans.dateEnd")}</Label>
                <Input type="date" value={form.date_end} onChange={(e) => setForm({ ...form, date_end: e.target.value })} dir="ltr" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">{t("caravans.doctorName")}</Label>
                <Input value={form.doctor_name} onChange={(e) => setForm({ ...form, doctor_name: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">{t("caravans.specialty")}</Label>
                <Input value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">{t("common.status")}</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: (v ?? "planned") as CaravanStatus })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planned">{t("caravans.statusPlanned")}</SelectItem>
                    <SelectItem value="active">{t("caravans.statusActive")}</SelectItem>
                    <SelectItem value="completed">{t("caravans.statusCompleted")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1 md:col-span-3">
                <Label className="text-xs text-muted-foreground">{t("caravans.notes")}</Label>
                <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">{t("caravans.location")}</span>
                <p className="font-medium">{caravan.location}</p>
              </div>
              <div>
                <span className="text-muted-foreground">{t("caravans.region")}</span>
                <p className="font-medium">{caravan.region || "-"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">{t("caravans.dateStart")}</span>
                <p className="font-medium" dir="ltr">
                  {new Date(caravan.date_start).toLocaleDateString()}
                </p>
              </div>
              {caravan.date_end && (
                <div>
                  <span className="text-muted-foreground">{t("caravans.dateEnd")}</span>
                  <p className="font-medium" dir="ltr">
                    {new Date(caravan.date_end).toLocaleDateString()}
                  </p>
                </div>
              )}
              <div>
                <span className="text-muted-foreground">{t("caravans.doctorName")}</span>
                <p className="font-medium">{caravan.doctor_name || "-"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">{t("caravans.specialty")}</span>
                <p className="font-medium">{caravan.specialty || "-"}</p>
              </div>
              {caravan.notes && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">{t("caravans.notes")}</span>
                  <p className="font-medium">{caravan.notes}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
        <StatCard
          title={t("caravans.totalBeneficiaries")}
          value={patientsList.length}
          icon={Users}
        />
        <StatCard
          title={t("caravans.aids")}
          value={(caravan.aid_records || []).length}
          icon={HandHeart}
        />
        <StatCard
          title={t("aid.totalCost")}
          value={`${totalCost.toLocaleString()} MAD`}
          icon={DollarSign}
        />
        <StatCard
          title={t("caravans.avgAge")}
          value={avgAge > 0 ? `${avgAge} ans` : "-"}
          icon={Users}
        />
        <StatCard
          title={t("caravans.withCin")}
          value={`${withCin}/${patientsList.length}`}
          icon={CreditCard}
        />
        <StatCard
          title={t("caravans.totalChildren")}
          value={totalChildren}
          icon={Baby}
        />
      </div>

      {/* Patients table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("caravans.patients")}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("patients.lastName")}</TableHead>
                <TableHead>{t("patients.firstName")}</TableHead>
                <TableHead>{t("patients.age")}</TableHead>
                <TableHead>{t("patients.sex")}</TableHead>
                <TableHead>{t("patients.cin")}</TableHead>
                <TableHead>{t("patients.numberOfChildren")}</TableHead>
                <TableHead>{t("patients.youngestChildAge")}</TableHead>
                <TableHead>{t("medical.diagnosis")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {patientsList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                    {t("common.noResults")}
                  </TableCell>
                </TableRow>
              ) : (
                patientsList.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.last_name}</TableCell>
                    <TableCell>{p.first_name}</TableCell>
                    <TableCell>{p.age || "-"}</TableCell>
                    <TableCell>
                      {p.sex && (
                        <Badge variant="outline">
                          {p.sex === "M" ? t("patients.male") : t("patients.female")}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell dir="ltr">{p.cin || "-"}</TableCell>
                    <TableCell>{p.number_of_children ?? "-"}</TableCell>
                    <TableCell>{p.youngest_child_age || "-"}</TableCell>
                    <TableCell>{p.diagnosis || "-"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
