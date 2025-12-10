import { createAction, Property } from "@activepieces/pieces-framework";
import { PDFDocument } from "pdf-lib";

function toBytes(file: any): Uint8Array {
  if (file.base64) return Buffer.from(file.base64, "base64");
  if (typeof file.data === "string") return Buffer.from(file.data, "base64");
  return new Uint8Array(file.data);
}

export const compressPdf = createAction({
  name: "compress-pdf",
  displayName: "Compress PDF",
  description: "Reduce PDF size",
  props: {
    file: Property.File({
      displayName: "PDF File",
      required: true,
    }),
  },
  async run(context) {
    const pdfBytes = toBytes(context.propsValue.file);

    const pdfDoc = await PDFDocument.load(pdfBytes, {
      updateMetadata: false,
      ignoreEncryption: true,
    });

    const compressed = await pdfDoc.save({ useObjectStreams: true });

    return {
      file: {
        base64: Buffer.from(compressed).toString("base64"),
        mimeType: "application/pdf",
        fileName: "compressed.pdf",
      },
    };
  },
});
