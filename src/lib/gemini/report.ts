import { getGeminiClient } from "./client";

interface ReportInput {
  caravanName: string;
  caravanLocation: string;
  caravanRegion: string;
  caravanDate: string;
  totalWomen: number;
  totalChildren: number;
  totalBoys: number;
  totalGirls: number;
  totalConsultations: number;
  doctorName: string;
  specialty: string;
}

export async function generateReportText(data: ReportInput): Promise<string> {
  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

  const prompt = `أنت كاتب تقارير متخصص في جمعية الكرامة للتنمية والتضامن، وهي جمعية خيرية مغربية تنظم قوافل طبية وتحسيسية لفائدة النساء والأطفال.

اكتب تقريرا احترافيا بالعربية عن حملة طبية وتحسيسية بنفس الأسلوب والهيكل التالي:

معلومات الحملة:
- المكان: ${data.caravanLocation}، ${data.caravanRegion}
- التاريخ: ${data.caravanDate}
- اسم الحملة: ${data.caravanName}
- الطبيب المسؤول: ${data.doctorName}
- التخصص: ${data.specialty}

الإحصائيات:
- عدد النساء المستفيدات: ${data.totalWomen}
- عدد الأطفال المستفيدين: ${data.totalChildren}
- الذكور من الأطفال: ${data.totalBoys}
- الإناث من الأطفال: ${data.totalGirls}
- عدد الفحوصات: ${data.totalConsultations}

هيكل التقرير المطلوب (اتبعه بدقة):

1. عنوان التقرير: "تقرير حول الحملة الطبية والتحسيسية ب${data.caravanLocation}"

2. فقرة تمهيدية: تبدأ بـ "في إطار الشراكة المبرمة بين جمعية الكرامة للتنمية والتضامن والمبادرة الوطنية للتنمية البشرية، وكذا مندوبية وزارة الصحة والحماية الاجتماعية..." وتذكر تاريخ ومكان الحملة وعدد المستفيدين.

3. "شملت الخدمات المقدمة خلال هذه الحملة:" (قائمة نقطية تشمل الفحوصات الطبية، طب النساء والأطفال، الفحص بالصدى، قياس السكر، توزيع الأدوية، دورة تحسيسية)

4. "تميزت الحملة ببعدها الاجتماعي، حيث تم:" (توزيع حقائب طبية، ملابس، ألعاب للأطفال)

5. "مستوى الموارد البشرية، فقد شارك في تأطير هذه الحملة:" (طبيبات، مولدات، ممرضات، أطر جمعية الكرامة)

6. "حضر هذه الحملة:" (السلطات المحلية، طاقم المركز الصحي، تقني الوحدة الصحية، الطاقم الطبي)

7. "جدول إحصيات الحملة:" (سأضيف الجدول برمجيا)

8. فقرة نجاح الحملة: تذكر تنزيل أهداف البرنامج المتفق عليه مع INDH ومندوبية وزارة الصحة

9. "شكر وتقدير:" شكر للسيد عامل صاحب الجلالة على الإقليم والسلطة المحلية ومندوب وزارة الصحة وكافة الأطر

10. "الخاتمة:" تأكيد التزام الجمعية بمواصلة جهودها

استخدم نفس الأسلوب الرسمي. لا تضع العنوان (سأضيفه برمجيا). ابدأ مباشرة من الفقرة التمهيدية.
ضع كل عنوان فرعي على سطر منفصل متبوع بنقطتين.
لا تضف جدول الإحصائيات في النص (سأضيفه برمجيا).`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}
