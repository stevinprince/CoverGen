import { Document, Packer, Paragraph, TextRun } from "docx";

export async function coverLetterToDocx(text: string): Promise<Buffer> {
  const paragraphs = text
    .split(/\n/)
    .map(
      (line) =>
        new Paragraph({
          children: [
            new TextRun({
              text: line,
              font: "Calibri",
              size: 24,
            }),
          ],
          spacing: { after: line.trim() === "" ? 120 : 60 },
        }),
    );

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: paragraphs.length
          ? paragraphs
          : [new Paragraph({ children: [new TextRun("")] })],
      },
    ],
  });

  return Packer.toBuffer(doc);
}
