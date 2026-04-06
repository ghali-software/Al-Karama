"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Save, RotateCcw, Loader2, Trash2, Plus } from "lucide-react";
import type { OcrBatchResult, OcrParticipant } from "@/lib/gemini/ocr";

interface OcrBatchEditorProps {
  imageUrl: string;
  data: OcrBatchResult;
  onSaved: () => void;
  onReset: () => void;
}

export function OcrBatchEditor({
  imageUrl,
  data,
  onSaved,
  onReset,
}: OcrBatchEditorProps) {
  const t = useTranslations();
  const [participants, setParticipants] = useState<OcrParticipant[]>(
    data.participants
  );
  const [saving, setSaving] = useState(false);
  const [savedCount, setSavedCount] = useState(0);

  const updateField = (
    index: number,
    field: keyof OcrParticipant,
    value: string | number | null
  ) => {
    setParticipants((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    );
  };

  const removeRow = (index: number) => {
    setParticipants((prev) => prev.filter((_, i) => i !== index));
  };

  const addRow = () => {
    setParticipants((prev) => [
      ...prev,
      {
        full_name: "",
        cin: "",
        age: null,
        number_of_children: null,
        youngest_child_age: "",
      },
    ]);
  };

  async function handleSaveAll() {
    setSaving(true);
    setSavedCount(0);

    try {
      const supabase = createClient();

      for (let i = 0; i < participants.length; i++) {
        const p = participants[i];
        if (!p.full_name.trim()) continue;

        // Split Arabic name: first word = last name, rest = first name
        const nameParts = p.full_name.trim().split(/\s+/);
        const lastName = nameParts[0] || "";
        const firstName = nameParts.slice(1).join(" ") || "";

        const { error } = await supabase.from("patients").insert({
          first_name: firstName || p.full_name,
          last_name: lastName,
          age: p.age,
          sex: "F",
          cin: p.cin || null,
          is_child: p.age !== null && p.age < 18,
          number_of_children: p.number_of_children,
          youngest_child_age: p.youngest_child_age || null,
        });

        if (!error) {
          setSavedCount((prev) => prev + 1);
        }
      }

      onSaved();
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setSaving(false);
    }
  }

  const confidenceColor =
    data.confidence >= 0.8
      ? "bg-green-500"
      : data.confidence >= 0.5
        ? "bg-yellow-500"
        : "bg-red-500";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{t("scan.review")}</h1>
          <Badge variant="outline" className="gap-2">
            <span className={`h-2 w-2 rounded-full ${confidenceColor}`} />
            {t("scan.confidence")}: {Math.round(data.confidence * 100)}%
          </Badge>
          <Badge variant="secondary">
            {participants.length} {t("patients.title").toLowerCase()}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onReset} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            {t("common.back")}
          </Button>
          <Button onClick={handleSaveAll} disabled={saving} className="gap-2">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {savedCount}/{participants.length}
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {t("scan.saveResults")} ({participants.length})
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Image preview */}
        <Card className="xl:sticky xl:top-4 self-start">
          <CardContent className="p-2">
            <div className="relative aspect-[3/4] w-full">
              <Image
                src={imageUrl}
                alt="Scanned form"
                fill
                className="object-contain rounded"
              />
            </div>
          </CardContent>
        </Card>

        {/* Editable table */}
        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">
              {t("patients.title")} ({participants.length})
            </CardTitle>
            <Button variant="outline" size="sm" onClick={addRow} className="gap-1">
              <Plus className="h-4 w-4" />
              {t("common.create")}
            </Button>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8">#</TableHead>
                  <TableHead>الإسم واللقب</TableHead>
                  <TableHead>رقم البطاقة</TableHead>
                  <TableHead>العمر</TableHead>
                  <TableHead>عدد الأطفال</TableHead>
                  <TableHead>سن آخر طفل</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {participants.map((p, index) => (
                  <TableRow key={index}>
                    <TableCell className="text-muted-foreground text-xs">
                      {index + 1}
                    </TableCell>
                    <TableCell>
                      <Input
                        value={p.full_name}
                        onChange={(e) =>
                          updateField(index, "full_name", e.target.value)
                        }
                        className="min-w-[200px]"
                        dir="rtl"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={p.cin}
                        onChange={(e) =>
                          updateField(index, "cin", e.target.value)
                        }
                        className="min-w-[120px]"
                        dir="ltr"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={p.age !== null ? String(p.age) : ""}
                        onChange={(e) =>
                          updateField(
                            index,
                            "age",
                            e.target.value ? Number(e.target.value) : null
                          )
                        }
                        type="number"
                        className="w-20"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={
                          p.number_of_children !== null
                            ? String(p.number_of_children)
                            : ""
                        }
                        onChange={(e) =>
                          updateField(
                            index,
                            "number_of_children",
                            e.target.value ? Number(e.target.value) : null
                          )
                        }
                        type="number"
                        className="w-16"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={p.youngest_child_age}
                        onChange={(e) =>
                          updateField(
                            index,
                            "youngest_child_age",
                            e.target.value
                          )
                        }
                        className="min-w-[120px]"
                        dir="rtl"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeRow(index)}
                        className="text-destructive h-8 w-8"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
