import { createAction, Property } from "@activepieces/pieces-framework";
import { doclingAuth, authFromCtx } from "../auth.js";
import { DoclingError } from "../errors.js";
import { normalizeFile } from "../files.js";
import { buildOptions, convertProps, executionMode, timeoutMs } from "../options.js";
import { runConversion } from "../client.js";
import { convertOutputFields } from "../output-schemas.js";

const fileProp = Property.File({
  displayName: "File",
  required: true,
  description: "The document to convert (PDF, DOCX, PPTX, XLSX, images, HTML, …).",
});

export const convertFileAction = createAction({
  auth: doclingAuth,
  name: "convert_file",
  displayName: "Convert File",
  description:
    "Converts an uploaded document with a docling-serve v1 API and returns the requested output formats (Markdown by default).",
  audience: "both",
  aiMetadata: {
    description:
      "Converts a document file to Markdown (or docling-document JSON / HTML / DocTags / plain text) using a docling-serve v1 service. Use for “parse/extract/read this document”. Text out; slow for very large documents (default deadline 10 minutes).",
    idempotent: true,
  },
  outputSchema: { fields: convertOutputFields },
  props: { file: fileProp, ...convertProps },
  run: async (ctx) => {
    // 0.32.0 types the required File property value as `ApFile`, but this
    // action also accepts data-URI strings (reactor config shape); the guard
    // and normalizeFile work on the raw value. Type-level adaptation only —
    // runtime behavior is exactly the brief's verbatim checks.
    const raw = ctx.propsValue.file as unknown;
    if (raw === undefined || raw === null || raw === "") {
      throw new DoclingError("BAD_FILE", "The file property is required.");
    }
    const file = normalizeFile(raw);
    return runConversion({
      auth: authFromCtx(ctx),
      source: { kind: "file", filename: file.filename, base64: file.base64 },
      options: buildOptions(ctx.propsValue as never),
      mode: executionMode(ctx.propsValue as never),
      timeoutMs: timeoutMs(ctx.propsValue as never),
      path: "convert",
    });
  },
});
