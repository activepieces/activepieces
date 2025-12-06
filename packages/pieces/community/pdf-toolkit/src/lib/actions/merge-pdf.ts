import { createAction, Property } from "@activepieces/pieces-framework";
import { PDFDocument } from "pdf-lib";

function toBytes(file: any): Uint8Array {
  if (file.base64) return Buffer.from(file.base64, "base64");
  if (typeof file.data === "string") return Buffer.from(file.data, "base64");
  return new Uint8Array(file.data);
}

export const mergePdf = createAction({
  name: "merge-pdf",
  displayName: "Merge PDF",
  description: "Merge multiple PDF files into a single PDF",
  props: {
    files: Property.Array({
      displayName: "PDF Files",
      description: "List of PDF files to merge",
      required: true,
      properties: {
        file: Property.File({
          displayName: "PDF File",
          required: true,
        }),
      },
    }),
  },

  async run(context) {
    const files = context.propsValue.files as Array<{ file: any }>;

    const pdfDoc = await PDFDocument.create();

    for (const item of files) {
      const pdfBytes = toBytes(item.file);
      const otherDoc = await PDFDocument.load(pdfBytes);

      const copiedPages = await pdfDoc.copyPages(
        otherDoc,
        otherDoc.getPageIndices()
      );

      copiedPages.forEach((page: any) => pdfDoc.addPage(page));
    }

    const mergedBytes = await pdfDoc.save();

    return {
      mergedPdf: Buffer.from(mergedBytes).toString("base64"),
    };
  },
});
