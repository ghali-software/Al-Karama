"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Save, RotateCcw, Loader2 } from "lucide-react";
import type { OcrParsedData, AidType } from "@/types";

interface OcrResultsEditorProps {
  imageUrl: string;
  data: OcrParsedData;
  onSave: () => void;
  onReset: () => void;
}

export function OcrResultsEditor({
  imageUrl,
  data,
  onSave,
  onReset,
}: OcrResultsEditorProps) {
  const t = useTranslations();
  const [formData, setFormData] = useState(data);
  const [saving, setSaving] = useState(false);

  const updatePatient = (field: string, value: string | number | boolean | null) => {
    setFormData((prev) => ({
      ...prev,
      patient: { ...prev.patient, [field]: value },
    }));
  };

  const updateMedical = (field: string, value: string | number | null) => {
    setFormData((prev) => ({
      ...prev,
      medical: { ...prev.medical, [field]: value },
    }));
  };

  const updateAid = (index: number, field: string, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      aid: prev.aid.map((a, i) => (i === index ? { ...a, [field]: value } : a)),
    }));
  };

  const addAid = () => {
    setFormData((prev) => ({
      ...prev,
      aid: [
        ...prev.aid,
        { aid_type: "other" as AidType, description: "", quantity: 1 },
      ],
    }));
  };

  const removeAid = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      aid: prev.aid.filter((_, i) => i !== index),
    }));
  };

  async function handleSave() {
    setSaving(true);
    try {
      const supabase = createClient();

      // Create patient
      const { data: patient, error: patientError } = await supabase
        .from("patients")
        .insert({
          first_name: formData.patient.first_name,
          last_name: formData.patient.last_name,
          date_of_birth: formData.patient.date_of_birth || null,
          age: formData.patient.age,
          sex: formData.patient.sex,
          cin: formData.patient.cin || null,
          phone: formData.patient.phone || null,
          address: formData.patient.address || null,
          city: formData.patient.city || null,
          is_child: formData.patient.is_child,
          guardian_name: formData.patient.guardian_name || null,
          guardian_cin: formData.patient.guardian_cin || null,
        })
        .select()
        .single();

      if (patientError) throw patientError;

      // Find or match caravan
      let caravanId: string | null = null;
      if (formData.caravan.location) {
        const { data: caravans } = await supabase
          .from("caravans")
          .select("id")
          .eq("location", formData.caravan.location)
          .limit(1);
        caravanId = caravans?.[0]?.id || null;
      }

      // Create medical record
      const { data: medRecord, error: medError } = await supabase
        .from("medical_records")
        .insert({
          patient_id: patient.id,
          caravan_id: caravanId,
          blood_pressure: formData.medical.blood_pressure || null,
          weight: formData.medical.weight,
          height: formData.medical.height,
          temperature: formData.medical.temperature,
          diagnosis: formData.medical.diagnosis || null,
          treatment: formData.medical.treatment || null,
          medical_history: formData.medical.medical_history || null,
        })
        .select()
        .single();

      if (medError) throw medError;

      // Create aid records
      if (formData.aid.length > 0) {
        const aidInserts = formData.aid.map((a) => ({
          patient_id: patient.id,
          caravan_id: caravanId,
          medical_record_id: medRecord.id,
          aid_type: a.aid_type,
          description: a.description || null,
          quantity: a.quantity,
        }));

        const { error: aidError } = await supabase
          .from("aid_records")
          .insert(aidInserts);

        if (aidError) throw aidError;
      }

      // Save OCR scan record
      await supabase.from("ocr_scans").insert({
        image_url: imageUrl,
        parsed_data: formData,
        confidence_score: formData.confidence,
        patient_id: patient.id,
        medical_record_id: medRecord.id,
      });

      onSave();
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setSaving(false);
    }
  }

  const confidenceColor =
    formData.confidence >= 0.8
      ? "bg-green-500"
      : formData.confidence >= 0.5
        ? "bg-yellow-500"
        : "bg-red-500";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("scan.review")}</h1>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="gap-2">
            <span className={`h-2 w-2 rounded-full ${confidenceColor}`} />
            {t("scan.confidence")}: {Math.round(formData.confidence * 100)}%
          </Badge>
          <Button variant="outline" onClick={onReset} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            {t("common.back")}
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {t("scan.saveResults")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Image preview */}
        <Card className="lg:sticky lg:top-4 self-start">
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

        {/* Form fields */}
        <div className="space-y-6">
          {/* Patient info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {t("patients.title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("patients.firstName")}</Label>
                  <Input
                    value={formData.patient.first_name}
                    onChange={(e) => updatePatient("first_name", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("patients.lastName")}</Label>
                  <Input
                    value={formData.patient.last_name}
                    onChange={(e) => updatePatient("last_name", e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>{t("patients.age")}</Label>
                  <Input
                    type="number"
                    value={formData.patient.age ?? ""}
                    onChange={(e) =>
                      updatePatient(
                        "age",
                        e.target.value ? Number(e.target.value) : null
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("patients.sex")}</Label>
                  <Select
                    value={formData.patient.sex || ""}
                    onValueChange={(v) => updatePatient("sex", v ?? "")}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M">{t("patients.male")}</SelectItem>
                      <SelectItem value="F">{t("patients.female")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("patients.cin")}</Label>
                  <Input
                    value={formData.patient.cin}
                    onChange={(e) => updatePatient("cin", e.target.value)}
                    dir="ltr"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("patients.phone")}</Label>
                  <Input
                    value={formData.patient.phone}
                    onChange={(e) => updatePatient("phone", e.target.value)}
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("patients.city")}</Label>
                  <Input
                    value={formData.patient.city}
                    onChange={(e) => updatePatient("city", e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("patients.address")}</Label>
                <Input
                  value={formData.patient.address}
                  onChange={(e) => updatePatient("address", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Medical info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {t("patients.medicalRecords")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>{t("medical.bloodPressure")}</Label>
                  <Input
                    value={formData.medical.blood_pressure}
                    onChange={(e) =>
                      updateMedical("blood_pressure", e.target.value)
                    }
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("medical.weight")}</Label>
                  <Input
                    type="number"
                    value={formData.medical.weight ?? ""}
                    onChange={(e) =>
                      updateMedical(
                        "weight",
                        e.target.value ? Number(e.target.value) : null
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("medical.height")}</Label>
                  <Input
                    type="number"
                    value={formData.medical.height ?? ""}
                    onChange={(e) =>
                      updateMedical(
                        "height",
                        e.target.value ? Number(e.target.value) : null
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("medical.temperature")}</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.medical.temperature ?? ""}
                    onChange={(e) =>
                      updateMedical(
                        "temperature",
                        e.target.value ? Number(e.target.value) : null
                      )
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("medical.diagnosis")}</Label>
                <Textarea
                  value={formData.medical.diagnosis}
                  onChange={(e) => updateMedical("diagnosis", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("medical.treatment")}</Label>
                <Textarea
                  value={formData.medical.treatment}
                  onChange={(e) => updateMedical("treatment", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("medical.medicalHistory")}</Label>
                <Textarea
                  value={formData.medical.medical_history}
                  onChange={(e) =>
                    updateMedical("medical_history", e.target.value)
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Aid records */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">
                {t("patients.aidRecords")}
              </CardTitle>
              <Button variant="outline" size="sm" onClick={addAid}>
                + {t("common.create")}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.aid.map((aid, index) => (
                <div key={index}>
                  {index > 0 && <Separator className="mb-4" />}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>{t("aid.type")}</Label>
                      <Select
                        value={aid.aid_type}
                        onValueChange={(v) =>
                          updateAid(index, "aid_type", v ?? "")
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[
                            "medication",
                            "glasses",
                            "consultation",
                            "surgery",
                            "dental",
                            "other",
                          ].map((type) => (
                            <SelectItem key={type} value={type}>
                              {t(`aid.${type}` as "aid.medication" | "aid.glasses" | "aid.consultation" | "aid.surgery" | "aid.dental" | "aid.other")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>{t("aid.description")}</Label>
                      <Input
                        value={aid.description}
                        onChange={(e) =>
                          updateAid(index, "description", e.target.value)
                        }
                      />
                    </div>
                    <div className="flex items-end gap-2">
                      <div className="flex-1 space-y-2">
                        <Label>{t("aid.quantity")}</Label>
                        <Input
                          type="number"
                          value={aid.quantity}
                          onChange={(e) =>
                            updateAid(index, "quantity", Number(e.target.value))
                          }
                        />
                      </div>
                      {formData.aid.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAid(index)}
                          className="text-destructive"
                        >
                          {t("common.delete")}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
