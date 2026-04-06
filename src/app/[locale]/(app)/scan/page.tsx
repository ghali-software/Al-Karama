"use client";

import { useState, useRef, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import Webcam from "react-webcam";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Camera, Upload, Loader2 } from "lucide-react";
import type { OcrBatchResult } from "@/lib/gemini/ocr";
import { OcrBatchEditor } from "@/components/ocr/ocr-batch-editor";

export default function ScanPage() {
  const t = useTranslations("scan");
  const locale = useLocale();
  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [processing, setProcessing] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<OcrBatchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const processImage = useCallback(async (file: File) => {
    setProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/ocr", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("OCR failed");

      const { data } = await res.json();

      const safeData: OcrBatchResult = {
        participants: (data?.participants || []).map(
          (p: Record<string, unknown>) => ({
            full_name: (p?.full_name as string) || "",
            cin: (p?.cin as string) || "",
            age: (p?.age as number) ?? null,
            number_of_children: (p?.number_of_children as number) ?? null,
            youngest_child_age: (p?.youngest_child_age as string) || "",
          })
        ),
        confidence: data?.confidence ?? 0,
      };
      setOcrResult(safeData);
    } catch {
      setError("Erreur lors de l'analyse du formulaire");
    } finally {
      setProcessing(false);
    }
  }, []);

  const handleCapture = useCallback(() => {
    const screenshot = webcamRef.current?.getScreenshot();
    if (screenshot) {
      setImagePreview(screenshot);
      fetch(screenshot)
        .then((res) => res.blob())
        .then((blob) => {
          const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
          processImage(file);
        });
    }
  }, [processImage]);

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);

      processImage(file);
    },
    [processImage]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);

      processImage(file);
    },
    [processImage]
  );

  const handleReset = () => {
    setImagePreview(null);
    setOcrResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  if (ocrResult && imagePreview) {
    return (
      <OcrBatchEditor
        imageUrl={imagePreview}
        data={ocrResult}
        onSaved={() => {
          handleReset();
          window.location.href = `/${locale}/patients`;
        }}
        onReset={handleReset}
      />
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("title")}</h1>

      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="camera" className="gap-2">
            <Camera className="h-4 w-4" />
            {t("camera")}
          </TabsTrigger>
          <TabsTrigger value="upload" className="gap-2">
            <Upload className="h-4 w-4" />
            {t("upload")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="camera">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("takePhoto")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {processing ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ms-2">{t("processing")}</span>
                </div>
              ) : (
                <>
                  <div className="relative aspect-[4/3] max-w-lg mx-auto overflow-hidden rounded-lg bg-muted">
                    <Webcam
                      ref={webcamRef}
                      screenshotFormat="image/jpeg"
                      className="w-full h-full object-cover"
                      videoConstraints={{ facingMode: "environment" }}
                    />
                  </div>
                  <div className="flex justify-center">
                    <Button onClick={handleCapture} size="lg" className="gap-2">
                      <Camera className="h-5 w-5" />
                      {t("takePhoto")}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upload">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("uploadFile")}</CardTitle>
            </CardHeader>
            <CardContent>
              {processing ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ms-2">{t("processing")}</span>
                </div>
              ) : (
                <div
                  className="border-2 border-dashed border-border rounded-lg p-12 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                >
                  <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground mb-2">
                    {t("uploadFile")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("supportedFormats")}
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/*,.pdf"
                    onChange={handleFileUpload}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive text-sm">{error}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
