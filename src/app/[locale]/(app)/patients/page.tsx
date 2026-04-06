"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Eye, Trash2, Loader2 } from "lucide-react";
import type { Patient } from "@/types";

export default function PatientsPage() {
  const t = useTranslations("patients");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  // New patient form state
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

  async function fetchPatients() {
    const supabase = createClient();
    let query = supabase
      .from("patients")
      .select("*")
      .order("created_at", { ascending: false });

    if (search) {
      query = query.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,cin.ilike.%${search}%`
      );
    }

    const { data } = await query;
    setPatients(data || []);
    setLoading(false);
  }

  useEffect(() => {
    fetchPatients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const supabase = createClient();
    const { error } = await supabase.from("patients").insert({
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
      number_of_children: form.number_of_children ? Number(form.number_of_children) : null,
      youngest_child_age: form.youngest_child_age || null,
    });

    if (!error) {
      setDialogOpen(false);
      setForm({
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
      fetchPatients();
    }
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === patients.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(patients.map((p) => p.id)));
    }
  }

  async function handleDeleteSelected() {
    setDeleting(true);
    const supabase = createClient();
    const ids = Array.from(selected);

    const { error } = await supabase
      .from("patients")
      .delete()
      .in("id", ids);

    if (!error) {
      setSelected(new Set());
      setConfirmDeleteOpen(false);
      fetchPatients();
    }
    setDeleting(false);
  }

  const allSelected = patients.length > 0 && selected.size === patients.length;
  const someSelected = selected.size > 0 && selected.size < patients.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <div className="flex items-center gap-2">
          {selected.size > 0 && (
            <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
              <DialogTrigger render={
                <Button variant="destructive" className="gap-2" />
              }>
                <Trash2 className="h-4 w-4" />
                {tCommon("deleteSelected", { count: selected.size })}
              </DialogTrigger>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle>{tCommon("confirmDelete")}</DialogTitle>
                </DialogHeader>
                <p className="text-sm text-muted-foreground">
                  {tCommon("confirmDeleteMessage", { count: selected.size })}
                </p>
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={() => setConfirmDeleteOpen(false)}>
                    {tCommon("cancel")}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteSelected}
                    disabled={deleting}
                    className="gap-2"
                  >
                    {deleting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    {tCommon("delete")}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger render={<Button className="gap-2" />}>
              <Plus className="h-4 w-4" />
              {t("addPatient")}
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{t("addPatient")}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t("firstName")}</Label>
                    <Input
                      required
                      value={form.first_name}
                      onChange={(e) =>
                        setForm({ ...form, first_name: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("lastName")}</Label>
                    <Input
                      required
                      value={form.last_name}
                      onChange={(e) =>
                        setForm({ ...form, last_name: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>{t("age")}</Label>
                    <Input
                      type="number"
                      value={form.age}
                      onChange={(e) => setForm({ ...form, age: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("sex")}</Label>
                    <Select
                      value={form.sex}
                      onValueChange={(v) => setForm({ ...form, sex: v ?? "" })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="M">{t("male")}</SelectItem>
                        <SelectItem value="F">{t("female")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t("cin")}</Label>
                    <Input
                      value={form.cin}
                      onChange={(e) => setForm({ ...form, cin: e.target.value })}
                      dir="ltr"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t("phone")}</Label>
                    <Input
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("city")}</Label>
                    <Input
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t("numberOfChildren")}</Label>
                    <Input
                      type="number"
                      value={form.number_of_children}
                      onChange={(e) =>
                        setForm({ ...form, number_of_children: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("youngestChildAge")}</Label>
                    <Input
                      value={form.youngest_child_age}
                      onChange={(e) =>
                        setForm({ ...form, youngest_child_age: e.target.value })
                      }
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full">
                  {tCommon("save")}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="ps-9"
          placeholder={tCommon("search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = someSelected;
                      }}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-gray-300 accent-primary cursor-pointer"
                    />
                  </TableHead>
                  <TableHead>{t("lastName")}</TableHead>
                  <TableHead>{t("firstName")}</TableHead>
                  <TableHead>{t("age")}</TableHead>
                  <TableHead>{t("sex")}</TableHead>
                  <TableHead>{t("cin")}</TableHead>
                  <TableHead>{t("numberOfChildren")}</TableHead>
                  <TableHead>{t("youngestChildAge")}</TableHead>
                  <TableHead>{tCommon("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      {tCommon("noResults")}
                    </TableCell>
                  </TableRow>
                ) : (
                  patients.map((patient) => (
                    <TableRow
                      key={patient.id}
                      data-state={selected.has(patient.id) ? "selected" : undefined}
                    >
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selected.has(patient.id)}
                          onChange={() => toggleSelect(patient.id)}
                          className="h-4 w-4 rounded border-gray-300 accent-primary cursor-pointer"
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {patient.last_name}
                      </TableCell>
                      <TableCell>{patient.first_name}</TableCell>
                      <TableCell>{patient.age || "-"}</TableCell>
                      <TableCell>
                        {patient.sex && (
                          <Badge variant="outline">
                            {patient.sex === "M" ? t("male") : t("female")}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell dir="ltr">{patient.cin || "-"}</TableCell>
                      <TableCell>{patient.number_of_children ?? "-"}</TableCell>
                      <TableCell>{patient.youngest_child_age || "-"}</TableCell>
                      <TableCell>
                        <Link href={`/${locale}/patients/${patient.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
