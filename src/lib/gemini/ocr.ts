import { getGeminiClient } from "./client";

export interface OcrParticipant {
  full_name: string;
  cin: string;
  age: number | null;
  number_of_children: number | null;
  youngest_child_age: string;
}

export interface OcrBatchResult {
  participants: OcrParticipant[];
  confidence: number;
}

const OCR_PROMPT = `Tu es un système OCR spécialisé pour les registres manuscrits de bénéficiaires de caravanes médicales au Maroc.

Cette image contient un TABLEAU manuscrit avec PLUSIEURS personnes (une par ligne).

Les colonnes du tableau sont (de droite à gauche) :
1. الإسم واللقب (Nom et prénom)
2. رقم البطاقة الوطنية (Numéro CIN - carte d'identité nationale)
3. العمر (Âge) - peut être une année de naissance (ex: 1985) ou un âge direct
4. عدد الأطفال (Nombre d'enfants)
5. سن آخر طفل (Âge du dernier enfant)

Il peut aussi y avoir un numéro de ligne à droite.

Retourne UNIQUEMENT le JSON valide suivant, sans texte ni backticks :

{
  "participants": [
    {
      "full_name": "الاسم الكامل",
      "cin": "XX123456",
      "age": 40,
      "number_of_children": 3,
      "youngest_child_age": "5 سنوات"
    }
  ],
  "confidence": 0.0
}

Règles IMPORTANTES :
- Extrais CHAQUE ligne du tableau comme un participant séparé
- Le CIN marocain : une ou deux lettres majuscules suivies de chiffres (ex: TA155426, Z216160, H484152, ID10866)
- Si la colonne "العمر" contient une année de naissance (ex: 1985, 2000), convertis en âge (année actuelle: 2026)
- Si la colonne contient directement un âge (ex: 31, 26), utilise-le tel quel
- Le nombre d'enfants est un chiffre simple (1, 2, 3, 4...)
- L'âge du dernier enfant peut contenir du texte en arabe (ex: "5 سنوات", "18 شهر", "أقل من سنة")
- Recopie le texte arabe exactement comme il est écrit
- Le score de confiance global est entre 0 et 1
- N'oublie AUCUNE ligne, même si certains champs sont illisibles (laisse-les vides)`;

export async function processOcrImage(
  imageBase64: string,
  mimeType: string
): Promise<OcrBatchResult> {
  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

  const result = await model.generateContent([
    OCR_PROMPT,
    {
      inlineData: {
        data: imageBase64,
        mimeType,
      },
    },
  ]);

  const responseText = result.response.text();

  const cleanedText = responseText
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();

  const parsed: OcrBatchResult = JSON.parse(cleanedText);
  return parsed;
}
