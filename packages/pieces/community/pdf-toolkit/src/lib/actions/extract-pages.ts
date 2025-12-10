import { createAction, Property } from "@activepieces/pieces-framework";
import { PDFDocument } from "pdf-lib";

function toBytes(file: any): Uint8Array {
  if (file.base64) return Buffer.from(file.base64, "base64");
  if (typeof file.data === "string") return Buffer.from(file.data, "base64");
  return new Uint8Array(file.data);
}

export const extractPages = createAction({
  name: "extract-pages",
  displayName: "Extract Pages",
  description: "Extract specific pages from a PDF.",
  props: {
    file: Property.File({
      displayName: "PDF File",
      required: true,
    }),
    pages: Property.ShortText({
      displayName: "Pages",
      description: "Example: 1,3,5-7",
      required: true,
    }),
  },
  async run(context) {
    const pdfBytes = toBytes(context.propsValue.file);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const newPdf = await PDFDocument.create();

    const pagesRequested = context.propsValue.pages
      .split(",")
      .flatMap((part) =>
        part.includes("-")
          ? Array.from(
              { length: +part.split("-")[1] - +part.split("-")[0] + 1 },
              (_, i) => +part.split("-")[0] + i
            )
          : [+part]
      );

    for (const p of pagesRequested) {
      const [copied] = await newPdf.copyPages(pdfDoc, [p - 1]);
      newPdf.addPage(copied);
    }

    const extracted = await newPdf.save();

    return {
      file: {
        base64: Buffer.from(extracted).toString("base64"),
        mimeType: "application/pdf",
        fileName: "extracted.pdf",
      },
    };
  },
});
