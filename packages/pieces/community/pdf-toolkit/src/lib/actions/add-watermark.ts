import { createAction, Property } from "@activepieces/pieces-framework";
import { PDFDocument, rgb } from "pdf-lib";

function toBytes(file: any): Uint8Array {
  if (file.base64) return Buffer.from(file.base64, "base64");
  if (typeof file.data === "string") return Buffer.from(file.data, "base64");
  return new Uint8Array(file.data);
}

export const addWatermark = createAction({
  name: "add-watermark",
  displayName: "Add Watermark",
  description: "Add a text watermark to each page",
  props: {
    file: Property.File({
      displayName: "PDF File",
      required: true,
    }),
    text: Property.ShortText({
      displayName: "Watermark Text",
      required: true,
    }),
  },
  async run(context) {
    const pdfBytes = toBytes(context.propsValue.file);
    const pdfDoc = await PDFDocument.load(pdfBytes);

    const pages = pdfDoc.getPages();
    for (const page of pages) {
      page.drawText(context.propsValue.text, {
        x: 50,
        y: 50,
        color: rgb(0.75, 0.75, 0.75),
        size: 24,
      });
    }

    const output = await pdfDoc.save();

    return {
      file: {
        base64: Buffer.from(output).toString("base64"),
        mimeType: "application/pdf",
        fileName: "watermarked.pdf",
      },
    };
  },
});
