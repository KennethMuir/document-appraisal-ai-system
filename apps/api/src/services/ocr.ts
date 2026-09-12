import { promises as fs } from "node:fs";
import { pdf } from "pdf-to-img";
import { createWorker } from "tesseract.js";

export type OcrResult = {
  text: string;
  pageCount: number;
};

export async function ocrPdf(
  filePath: string
): Promise<OcrResult> {
  const document = await pdf(filePath, {
    scale: 2,
    format: "png",
  });

  const worker = await createWorker("eng");

  const pageTexts: string[] = [];
  let pageCount = 0;

  try {
    for await (const image of document) {
      pageCount += 1;

      const result = await worker.recognize(
        image
      );

      const pageText = String(
        result.data.text || ""
      ).trim();

      if (pageText) {
        pageTexts.push(pageText);
      }
    }

    return {
      text: pageTexts.join("\n\n").trim(),
      pageCount,
    };
  } finally {
    await worker.terminate();
    await document.destroy();
  }
}
