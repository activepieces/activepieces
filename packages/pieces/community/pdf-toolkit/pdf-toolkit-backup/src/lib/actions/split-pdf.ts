import { createAction, Property } from "@activepieces/pieces-framework";
import { PDFDocument } from "pdf-lib";

function toBytes(file: any): Uint8Array {
  if (file.base64) return Buffer.from(file.base64, "base64");
  if (typeof file.data === "string") return Buffer.from(file.data, "base64");
  return new Uint8Array(file.data);
}

export const splitPdf = createAction({
  name: "split-pdf",
  displayName: "Split PDF",
  description: "Split PDF into separate pages",
  props: {
    file: Property.File({ displayName: "PDF File", required: true }),
  },
  async run(context) {
    const pdfBytes = toBytes(context.propsValue.file);
    const pdfDoc = await PDFDocument.load(pdfBytes);

    const outputs: any[] = [];
    const pages = pdfDoc.getPages();

    for (let i = 0; i < pages.length; i++) {
      const newPdf = await PDFDocument.create();
      const [copied] = await newPdf.copyPages(pdfDoc, [i]);
      newPdf.addPage(copied);
      const bytes = await newPdf.save();
      outputs.push({
        file: {
          base64: Buffer.from(bytes).toString("base64"),
          mimeType: "application/pdf",
          fileName: `page-${i + 1}.pdf`,
        },
      });
    }

    return outputs;
  },
});
