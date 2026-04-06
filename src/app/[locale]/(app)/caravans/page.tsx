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
import { Textarea } from "@/components/ui/textarea";
import { Plus, Eye, Trash2, Loader2 } from "lucide-react";
import type { Caravan, CaravanStatus } from "@/types";

const statusColors: Record<CaravanStatus, string> = {
  planned: "bg-blue-100 text-blue-800",
  active: "bg-green-100 text-green-800",
  completed: "bg-gray-100 text-gray-800",
};

export default function CaravansPage() {
  const t = useTranslations("caravans");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const [caravans, setCaravans] = useState<Caravan[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

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

  async function fetchCaravans() {
    const supabase = createClient();
    const { data } = await supabase
      .from("caravans")
      .select("*")
      .order("date_start", { ascending: false });
    setCaravans(data || []);
    setLoading(false);
  }

  useEffect(() => {
    fetchCaravans();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const supabase = createClient();
    const { error } = await supabase.from("caravans").insert({
      name: form.name,
      location: form.location,
      region: form.region || null,
      date_start: form.date_start,
      date_end: form.date_end || null,
      doctor_name: form.doctor_name || null,
      specialty: form.specialty || null,
      status: form.status,
      notes: form.notes || null,
    });

    if (!error) {
      setDialogOpen(false);
      setForm({
        name: "",
        location: "",
        region: "",
        date_start: "",
        date_end: "",
        doctor_name: "",
        specialty: "",
        status: "planned",
        notes: "",
      });
      fetchCaravans();
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
    if (selected.size === caravans.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(caravans.map((c) => c.id)));
    }
  }

  async function handleDeleteSelected() {
    setDeleting(true);
    const supabase = createClient();
    const ids = Array.from(selected);
    const { error } = await supabase.from("caravans").delete().in("id", ids);
    if (!error) {
      setSelected(new Set());
      setConfirmDeleteOpen(false);
      fetchCaravans();
    }
    setDeleting(false);
  }

  const statusLabel = (status: CaravanStatus) => {
    const map = {
      planned: t("statusPlanned"),
      active: t("statusActive"),
      completed: t("statusCompleted"),
    };
    return map[status];
  };

  const allSelected = caravans.length > 0 && selected.size === caravans.length;
  const someSelected = selected.size > 0 && selected.size < caravans.length;

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
              {t("addCaravan")}
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{t("addCaravan")}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label>{t("name")}</Label>
                  <Input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t("location")}</Label>
                    <Input
                      required
                      value={form.location}
                      onChange={(e) =>
                        setForm({ ...form, location: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("region")}</Label>
                    <Input
                      value={form.region}
                      onChange={(e) =>
                        setForm({ ...form, region: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t("dateStart")}</Label>
                    <Input
                      type="date"
                      required
                      value={form.date_start}
                      onChange={(e) =>
                        setForm({ ...form, date_start: e.target.value })
                      }
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("dateEnd")}</Label>
                    <Input
                      type="date"
                      value={form.date_end}
                      onChange={(e) =>
                        setForm({ ...form, date_end: e.target.value })
                      }
                      dir="ltr"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t("doctorName")}</Label>
                    <Input
                      value={form.doctor_name}
                      onChange={(e) =>
                        setForm({ ...form, doctor_name: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("specialty")}</Label>
                    <Input
                      value={form.specialty}
                      onChange={(e) =>
                        setForm({ ...form, specialty: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{tCommon("status")}</Label>
                  <Select
                    value={form.status}
                    onValueChange={(v) =>
                      setForm({ ...form, status: (v ?? "planned") as CaravanStatus })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planned">{t("statusPlanned")}</SelectItem>
                      <SelectItem value="active">{t("statusActive")}</SelectItem>
                      <SelectItem value="completed">
                        {t("statusCompleted")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("notes")}</Label>
                  <Textarea
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  />
                </div>
                <Button type="submit" className="w-full">
                  {tCommon("save")}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

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
                  <TableHead>{t("name")}</TableHead>
                  <TableHead>{t("location")}</TableHead>
                  <TableHead>{t("dateStart")}</TableHead>
                  <TableHead>{tCommon("status")}</TableHead>
                  <TableHead>{t("doctorName")}</TableHead>
                  <TableHead>{tCommon("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {caravans.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-8 text-muted-foreground"
                    >
                      {tCommon("noResults")}
                    </TableCell>
                  </TableRow>
                ) : (
                  caravans.map((caravan) => (
                    <TableRow
                      key={caravan.id}
                      data-state={selected.has(caravan.id) ? "selected" : undefined}
                    >
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selected.has(caravan.id)}
                          onChange={() => toggleSelect(caravan.id)}
                          className="h-4 w-4 rounded border-gray-300 accent-primary cursor-pointer"
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {caravan.name}
                      </TableCell>
                      <TableCell>{caravan.location}</TableCell>
                      <TableCell dir="ltr">
                        {new Date(caravan.date_start).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[caravan.status]}>
                          {statusLabel(caravan.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>{caravan.doctor_name || "-"}</TableCell>
                      <TableCell>
                        <Link href={`/${locale}/caravans/${caravan.id}`}>
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
