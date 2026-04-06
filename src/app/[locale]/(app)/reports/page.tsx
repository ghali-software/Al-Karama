"use client";

import { useEffect, useState, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  FileText,
  Loader2,
  Upload,
  Image as ImageIcon,
  X,
  Download,
} from "lucide-react";
import type { Caravan } from "@/types";

export default function ReportsPage() {
  const t = useTranslations("reports");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  const [caravans, setCaravans] = useState<Caravan[]>([]);
  const [generating, setGenerating] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<string | null>(null);
  const [reportTitle, setReportTitle] = useState("");

  // Form
  const [selectedCaravanId, setSelectedCaravanId] = useState("");
  const [totalWomen, setTotalWomen] = useState("");
  const [totalChildren, setTotalChildren] = useState("");
  const [totalBoys, setTotalBoys] = useState("");
  const [totalGirls, setTotalGirls] = useState("");
  const [totalConsultations, setTotalConsultations] = useState("");

  // File uploads
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [stampFile, setStampFile] = useState<File | null>(null);
  const [stampPreview, setStampPreview] = useState<string | null>(null);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const stampInputRef = useRef<HTMLInputElement>(null);
  const photosInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("caravans")
      .select("*")
      .order("date_start", { ascending: false })
      .then(({ data }) => setCaravans(data || []));
  }, []);

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  function handlePhotosUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    setPhotoFiles((prev) => [...prev, ...files]);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () =>
        setPhotoPreviews((prev) => [...prev, reader.result as string]);
      reader.readAsDataURL(file);
    });
  }

  function removePhoto(index: number) {
    setPhotoFiles((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCaravanId) return;
    setGenerating(true);

    try {
      const selectedCaravan = caravans.find((c) => c.id === selectedCaravanId);
      if (!selectedCaravan) return;

      const formData = new FormData();
      formData.append("caravanId", selectedCaravanId);
      formData.append("caravanName", selectedCaravan.name);
      formData.append("caravanLocation", selectedCaravan.location);
      formData.append("caravanRegion", selectedCaravan.region || "");
      formData.append("caravanDate", selectedCaravan.date_start);
      formData.append("doctorName", selectedCaravan.doctor_name || "");
      formData.append("specialty", selectedCaravan.specialty || "");
      formData.append("totalWomen", totalWomen || "0");
      formData.append("totalChildren", totalChildren || "0");
      formData.append("totalBoys", totalBoys || "0");
      formData.append("totalGirls", totalGirls || "0");
      formData.append("totalConsultations", totalConsultations || "0");

      if (logoFile) formData.append("logo", logoFile);
      if (stampFile) formData.append("stamp", stampFile);
      photoFiles.forEach((f) => formData.append("photos", f));

      const res = await fetch("/api/reports/generate", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Generation failed");

      // Download the DOCX file
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const title = `تقرير - ${selectedCaravan.name}`;
      setReportTitle(title);

      const a = document.createElement("a");
      a.href = url;
      a.download = `${title}.docx`;
      a.click();
      URL.revokeObjectURL(url);

      setGeneratedReport(title);
    } catch (error) {
      console.error("Report generation error:", error);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("title")}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("generate")}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleGenerate} className="space-y-4">
                {/* Caravan Selection */}
                <div className="space-y-2">
                  <Label>القافلة الطبية</Label>
                  <Select
                    value={selectedCaravanId}
                    onValueChange={(v) => setSelectedCaravanId(v ?? "")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر القافلة" />
                    </SelectTrigger>
                    <SelectContent>
                      {caravans.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name} - {c.location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>عدد النساء المستفيدات</Label>
                    <Input
                      type="number"
                      value={totalWomen}
                      onChange={(e) => setTotalWomen(e.target.value)}
                      placeholder="85"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>عدد الأطفال المستفيدين</Label>
                    <Input
                      type="number"
                      value={totalChildren}
                      onChange={(e) => setTotalChildren(e.target.value)}
                      placeholder="124"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>الذكور من الأطفال</Label>
                    <Input
                      type="number"
                      value={totalBoys}
                      onChange={(e) => setTotalBoys(e.target.value)}
                      placeholder="58"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>الإناث من الأطفال</Label>
                    <Input
                      type="number"
                      value={totalGirls}
                      onChange={(e) => setTotalGirls(e.target.value)}
                      placeholder="66"
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label>عدد الفحوصات</Label>
                    <Input
                      type="number"
                      value={totalConsultations}
                      onChange={(e) => setTotalConsultations(e.target.value)}
                      placeholder="209"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full gap-2"
                  disabled={generating || !selectedCaravanId}
                >
                  {generating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t("generating")}
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4" />
                      {t("generate")} (Word)
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {generatedReport && (
            <Card className="border-green-500/50">
              <CardContent className="pt-6 flex items-center gap-3">
                <Download className="h-5 w-5 text-green-600" />
                <span className="font-medium">{reportTitle}</span>
                <Badge variant="secondary">DOCX</Badge>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Uploads */}
        <div className="space-y-6">
          {/* Logo Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">شعار الجمعية</CardTitle>
            </CardHeader>
            <CardContent>
              {logoPreview ? (
                <div className="flex items-center gap-4">
                  <img
                    src={logoPreview}
                    alt="Logo"
                    className="h-20 w-20 object-contain border rounded"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setLogoFile(null);
                      setLogoPreview(null);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div
                  className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => logoInputRef.current?.click()}
                >
                  <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    تحميل شعار الجمعية
                  </p>
                  <input
                    ref={logoInputRef}
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleLogoUpload}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stamp Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">ختم الجمعية (cachet)</CardTitle>
            </CardHeader>
            <CardContent>
              {stampPreview ? (
                <div className="flex items-center gap-4">
                  <img
                    src={stampPreview}
                    alt="Cachet"
                    className="h-20 w-20 object-contain border rounded"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setStampFile(null);
                      setStampPreview(null);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div
                  className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => stampInputRef.current?.click()}
                >
                  <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Cachet / signature de l&apos;association
                  </p>
                  <input
                    ref={stampInputRef}
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setStampFile(file);
                      const reader = new FileReader();
                      reader.onload = () =>
                        setStampPreview(reader.result as string);
                      reader.readAsDataURL(file);
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Photos Upload */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">
                صور الحملة ({photoPreviews.length})
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => photosInputRef.current?.click()}
                className="gap-1"
              >
                <Upload className="h-4 w-4" />
                إضافة صور
              </Button>
              <input
                ref={photosInputRef}
                type="file"
                className="hidden"
                accept="image/*"
                multiple
                onChange={handlePhotosUpload}
              />
            </CardHeader>
            <CardContent>
              {photoPreviews.length === 0 ? (
                <div
                  className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => photosInputRef.current?.click()}
                >
                  <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    تحميل صور من أجواء الحملة
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {photoPreviews.map((src, i) => (
                    <div key={i} className="relative group">
                      <img
                        src={src}
                        alt={`Photo ${i + 1}`}
                        className="h-24 w-full object-cover rounded border"
                      />
                      <button
                        onClick={() => removePhoto(i)}
                        className="absolute top-1 end-1 bg-destructive text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
