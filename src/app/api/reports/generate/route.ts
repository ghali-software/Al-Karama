import { NextRequest, NextResponse } from "next/server";
import { generateReportText } from "@/lib/gemini/report";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  ImageRun,
  BorderStyle,
  Header,
  Footer,
  PageBreak,
  ShadingType,
  LevelFormat,
  VerticalAlign,
} from "docx";

// A4 in DXA
const PAGE_WIDTH = 11906;
const PAGE_HEIGHT = 16838;
const MARGIN_LR = 1134;
const MARGIN_TB = 850;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LR * 2;

const FONT = "Arial";
const GREEN = "1a5c2e";

function rtlP(
  text: string,
  opts: {
    bold?: boolean;
    size?: number;
    color?: string;
    alignment?: (typeof AlignmentType)[keyof typeof AlignmentType];
    spacing?: { before?: number; after?: number };
  } = {}
): Paragraph {
  return new Paragraph({
    bidirectional: true,
    alignment: opts.alignment ?? AlignmentType.START,
    spacing: opts.spacing ?? { after: 120 },
    children: [
      new TextRun({
        text,
        font: FONT,
        size: opts.size ?? 24,
        bold: opts.bold ?? false,
        color: opts.color,
        rightToLeft: true,
      }),
    ],
  });
}

function gap(after = 80): Paragraph {
  return new Paragraph({ spacing: { after }, children: [] });
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const caravanName = formData.get("caravanName") as string;
    const caravanLocation = formData.get("caravanLocation") as string;
    const caravanRegion = formData.get("caravanRegion") as string;
    const caravanDate = formData.get("caravanDate") as string;
    const doctorName = formData.get("doctorName") as string;
    const specialty = formData.get("specialty") as string;
    const totalWomen = Number(formData.get("totalWomen")) || 0;
    const totalChildren = Number(formData.get("totalChildren")) || 0;
    const totalBoys = Number(formData.get("totalBoys")) || 0;
    const totalGirls = Number(formData.get("totalGirls")) || 0;
    const totalConsultations = Number(formData.get("totalConsultations")) || 0;

    const logoFile = formData.get("logo") as File | null;
    const stampFile = formData.get("stamp") as File | null;
    const photoFiles = formData.getAll("photos") as File[];

    // Generate AI text
    const aiText = await generateReportText({
      caravanName,
      caravanLocation,
      caravanRegion,
      caravanDate,
      totalWomen,
      totalChildren,
      totalBoys,
      totalGirls,
      totalConsultations,
      doctorName,
      specialty,
    });

    // Buffers
    let logoBuffer: Buffer | null = null;
    if (logoFile) logoBuffer = Buffer.from(await logoFile.arrayBuffer());

    let stampBuffer: Buffer | null = null;
    if (stampFile) stampBuffer = Buffer.from(await stampFile.arrayBuffer());

    const photoBuffers: Buffer[] = [];
    for (const photo of photoFiles) {
      photoBuffers.push(Buffer.from(await photo.arrayBuffer()));
    }

    // Format date
    const dateObj = new Date(caravanDate);
    const formattedDate = `${dateObj.getFullYear()}/${String(dateObj.getMonth() + 1).padStart(2, "0")}/${String(dateObj.getDate()).padStart(2, "0")}`;

    // ─── HEADER (repeated on every page) ───
    // Simple stacked paragraphs, all RTL aligned RIGHT
    const headerChildren: Paragraph[] = [];
    if (logoBuffer) {
      headerChildren.push(
        new Paragraph({
          bidirectional: true,
          alignment: AlignmentType.START,
          spacing: { after: 40 },
          children: [
            new ImageRun({
              data: logoBuffer,
              transformation: { width: 80, height: 80 },
              type: "png",
              altText: { title: "Logo", description: "Al Karama", name: "logo" },
            }),
          ],
        })
      );
    }
    headerChildren.push(
      rtlP("جمعية الكرامة للتنمية و التضامن", {
        bold: true, size: 18, color: GREEN, spacing: { after: 0 },
      })
    );
    headerChildren.push(
      new Paragraph({
        bidirectional: true,
        alignment: AlignmentType.START,
        spacing: { after: 0 },
        children: [
          new TextRun({
            text: "Association Al Karama pour le developpement et la Solidarite",
            font: FONT, size: 14, italics: true, color: "888888", rightToLeft: true,
          }),
        ],
      })
    );
    headerChildren.push(
      rtlP(`بنسليمان، في ${formattedDate}`, {
        size: 18, spacing: { after: 0 },
      })
    );

    // ─── FOOTER ───
    const footerParagraph = new Paragraph({
      alignment: AlignmentType.CENTER,
      bidirectional: true,
      children: [
        new TextRun({
          text: "العنوان: الرقم 1 زاوية زنقة طارق بن زياد وزنقة زرايدي غفور بنسليمان .صندوق البريده 40172 البريد الالكتروني:contac@alkaramadevsol.m",
          font: FONT, size: 14, color: GREEN, rightToLeft: true,
        }),
      ],
    });

    // ─── CONTENT ───
    const content: (Paragraph | Table)[] = [];

    // Title
    content.push(gap(200));
    content.push(
      rtlP(`تقرير حول الحملة الطبية والتحسيسية ب${caravanLocation}`, {
        bold: true, size: 32, color: GREEN,
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 300 },
      })
    );

    // AI body
    const textLines = aiText.split("\n").filter((l) => l.trim());
    for (const line of textLines) {
      const trimmed = line.trim();
      const isSubtitle = trimmed.endsWith(":") || trimmed.startsWith("**") || trimmed.startsWith("##");
      const isBullet = trimmed.startsWith("- ") || trimmed.startsWith("* ");
      const cleanText = trimmed.replace(/\*\*/g, "").replace(/^#+\s*/, "").replace(/^[-*]\s*/, "");

      if (isBullet) {
        content.push(
          new Paragraph({
            bidirectional: true,
            alignment: AlignmentType.START,
            numbering: { reference: "rtl-bullets", level: 0 },
            spacing: { after: 60 },
            children: [
              new TextRun({ text: cleanText, font: FONT, size: 22, rightToLeft: true }),
            ],
          })
        );
      } else if (isSubtitle) {
        content.push(gap(100));
        content.push(rtlP(cleanText, { bold: true, size: 26, color: GREEN, spacing: { before: 200, after: 120 } }));
      } else {
        content.push(rtlP(cleanText, { size: 22, spacing: { after: 160 } }));
      }
    }

    // ─── STATS TABLE ───
    content.push(gap());
    content.push(rtlP("جدول إحصيات الحملة:", { bold: true, size: 26, color: GREEN, spacing: { before: 200, after: 200 } }));

    const border = { style: BorderStyle.SINGLE, size: 1, color: "AAAAAA" };
    const borders = { top: border, bottom: border, left: border, right: border };
    const colW = Math.floor(CONTENT_WIDTH / 5);
    const cellMargins = { top: 80, bottom: 80, left: 100, right: 100 };

    const headers = ["عدد النساء المستفيدات", "عدد الأطفال المستفيدين", "الذكور من الأطفال", "الإناث من الأطفال", "عدد الفحوصات"];
    const values = [String(totalWomen), String(totalChildren), String(totalBoys), String(totalGirls), String(totalConsultations)];

    content.push(
      new Table({
        width: { size: CONTENT_WIDTH, type: WidthType.DXA },
        columnWidths: Array(5).fill(colW),
        visuallyRightToLeft: true,
        rows: [
          new TableRow({
            children: headers.map((text) =>
              new TableCell({
                borders, width: { size: colW, type: WidthType.DXA }, margins: cellMargins,
                shading: { fill: "E8F5EF", type: ShadingType.CLEAR },
                children: [new Paragraph({
                  bidirectional: true, alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text, font: FONT, size: 18, bold: true, rightToLeft: true, color: GREEN })],
                })],
              })
            ),
          }),
          new TableRow({
            children: values.map((text) =>
              new TableCell({
                borders, width: { size: colW, type: WidthType.DXA }, margins: cellMargins,
                children: [new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text, font: FONT, size: 24, bold: true })],
                })],
              })
            ),
          }),
        ],
      })
    );

    // ─── PHOTOS (on new pages) ───
    if (photoBuffers.length > 0) {
      content.push(new Paragraph({ children: [new PageBreak()] }));
      content.push(rtlP("صور ملتقطة من أجواء الحملة:", { bold: true, size: 26, color: GREEN, spacing: { before: 100, after: 300 } }));

      const noBorder2 = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
      const noBorders2 = { top: noBorder2, bottom: noBorder2, left: noBorder2, right: noBorder2 };
      const pColW = Math.floor(CONTENT_WIDTH / 2);

      for (let i = 0; i < photoBuffers.length; i += 2) {
        const cells: TableCell[] = [];
        cells.push(new TableCell({
          borders: noBorders2, width: { size: pColW, type: WidthType.DXA },
          margins: { top: 100, bottom: 100, left: 100, right: 100 },
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new ImageRun({
              data: photoBuffers[i], transformation: { width: 280, height: 210 }, type: "jpg",
              altText: { title: `Photo ${i + 1}`, description: `Photo ${i + 1}`, name: `p${i}` },
            })],
          })],
        }));

        if (photoBuffers[i + 1]) {
          cells.push(new TableCell({
            borders: noBorders2, width: { size: pColW, type: WidthType.DXA },
            margins: { top: 100, bottom: 100, left: 100, right: 100 },
            children: [new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new ImageRun({
                data: photoBuffers[i + 1], transformation: { width: 280, height: 210 }, type: "jpg",
                altText: { title: `Photo ${i + 2}`, description: `Photo ${i + 2}`, name: `p${i + 1}` },
              })],
            })],
          }));
        } else {
          cells.push(new TableCell({
            borders: noBorders2, width: { size: pColW, type: WidthType.DXA },
            children: [new Paragraph({ children: [] })],
          }));
        }

        content.push(new Table({
          width: { size: CONTENT_WIDTH, type: WidthType.DXA },
          columnWidths: [pColW, pColW],
          rows: [new TableRow({ children: cells })],
        }));
        content.push(gap(100));
      }
    }

    // ─── SIGNATURE PAGE (always last page) ───
    content.push(new Paragraph({ children: [new PageBreak()] }));

    // Some space before signatures
    for (let i = 0; i < 6; i++) content.push(gap(200));

    // Signature boxes - large with borders for actual signatures
    const sigColW = Math.floor(CONTENT_WIDTH / 2);
    const sigBorder = { style: BorderStyle.SINGLE, size: 1, color: "AAAAAA" };
    const sigBorders = { top: sigBorder, bottom: sigBorder, left: sigBorder, right: sigBorder };

    content.push(
      new Table({
        width: { size: CONTENT_WIDTH, type: WidthType.DXA },
        columnWidths: [sigColW, sigColW],
        visuallyRightToLeft: true,
        rows: [
          // Labels
          new TableRow({
            children: [
              new TableCell({
                borders: sigBorders,
                width: { size: sigColW, type: WidthType.DXA },
                margins: { top: 120, bottom: 120, left: 120, right: 120 },
                shading: { fill: "F5F5F5", type: ShadingType.CLEAR },
                children: [new Paragraph({
                  bidirectional: true, alignment: AlignmentType.CENTER,
                  children: [new TextRun({
                    text: "إمضاء: رئيس جمعية الكرامة", font: FONT, size: 22, bold: true, rightToLeft: true,
                  })],
                })],
              }),
              new TableCell({
                borders: sigBorders,
                width: { size: sigColW, type: WidthType.DXA },
                margins: { top: 120, bottom: 120, left: 120, right: 120 },
                shading: { fill: "F5F5F5", type: ShadingType.CLEAR },
                children: [new Paragraph({
                  bidirectional: true, alignment: AlignmentType.CENTER,
                  children: [new TextRun({
                    text: "إمضاء: الكتابة العامة", font: FONT, size: 22, bold: true, rightToLeft: true,
                  })],
                })],
              }),
            ],
          }),
          // Empty space for actual signatures (tall cells) - stamp goes in president cell
          new TableRow({
            height: { value: 3000, rule: "atLeast" as unknown as typeof import("docx").HeightRule.AT_LEAST },
            children: [
              // President cell (RIGHT in RTL = first cell)
              new TableCell({
                borders: sigBorders,
                width: { size: sigColW, type: WidthType.DXA },
                verticalAlign: VerticalAlign.CENTER,
                children: stampBuffer
                  ? [
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [] }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new ImageRun({
                            data: stampBuffer,
                            transformation: { width: 120, height: 120 },
                            type: "png",
                            altText: { title: "Cachet", description: "Cachet", name: "stamp" },
                          }),
                        ],
                      }),
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [] }),
                    ]
                  : [
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [] }),
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [] }),
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [] }),
                    ],
              }),
              // Secretary cell
              new TableCell({
                borders: sigBorders,
                width: { size: sigColW, type: WidthType.DXA },
                verticalAlign: VerticalAlign.CENTER,
                children: [
                  new Paragraph({ alignment: AlignmentType.CENTER, children: [] }),
                  new Paragraph({ alignment: AlignmentType.CENTER, children: [] }),
                  new Paragraph({ alignment: AlignmentType.CENTER, children: [] }),
                ],
              }),
            ],
          }),
        ],
      })
    );

    // ─── BUILD DOCX ───
    const doc = new Document({
      styles: {
        default: { document: { run: { font: FONT, size: 24 } } },
      },
      numbering: {
        config: [{
          reference: "rtl-bullets",
          levels: [{
            level: 0, format: LevelFormat.BULLET, text: "\u2022",
            alignment: AlignmentType.START,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          }],
        }],
      },
      sections: [{
        properties: {
          page: {
            size: { width: PAGE_WIDTH, height: PAGE_HEIGHT },
            margin: { top: MARGIN_TB, bottom: MARGIN_TB, right: MARGIN_LR, left: MARGIN_LR },
          },
        },
        headers: { default: new Header({ children: headerChildren }) },
        footers: { default: new Footer({ children: [footerParagraph] }) },
        children: content,
      }],
    });

    const buffer = await Packer.toBuffer(doc);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="rapport-${caravanLocation}.docx"`,
      },
    });
  } catch (error) {
    console.error("Report generation error:", error);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
