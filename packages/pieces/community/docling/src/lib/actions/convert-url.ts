import { createAction, Property } from "@activepieces/pieces-framework";
import { doclingAuth, authFromCtx } from "../auth.js";
import { DoclingError } from "../errors.js";
import { buildOptions, convertProps, executionMode, timeoutMs } from "../options.js";
import { runConversion } from "../client.js";
import { convertOutputFields } from "../output-schemas.js";

const urlProp = Property.ShortText({
  displayName: "URL",
  required: true,
  description: "Public URL of the document to convert (PDF, DOCX, …). ZIP archives are not supported.",
});

export const convertUrlAction = createAction({
  auth: doclingAuth,
  name: "convert_url",
  displayName: "Convert URL",
  description:
    "Downloads and converts a document from a public URL with a docling-serve v1 API and returns the requested output formats.",
  audience: "both",
  aiMetadata: {
    description:
      "Converts a document at a public URL to Markdown (or other formats) via docling-serve. Use when the source is a link rather than an uploaded file.",
    idempotent: true,
  },
  outputSchema: { fields: convertOutputFields },
  props: { url: urlProp, ...convertProps },
  run: async (ctx) => {
    const raw = ctx.propsValue.url;
    if (typeof raw !== "string" || raw.trim() === "") {
      throw new DoclingError("VALIDATION", "The URL property is required.");
    }
    const url = raw.trim();
    if (url.toLowerCase().endsWith(".zip")) {
      throw new DoclingError("VALIDATION", "zip archives are not supported — convert the individual documents instead.");
    }
    return runConversion({
      auth: authFromCtx(ctx),
      source: { kind: "http", url },
      options: buildOptions(ctx.propsValue as never),
      mode: executionMode(ctx.propsValue as never),
      timeoutMs: timeoutMs(ctx.propsValue as never),
      path: "convert",
    });
  },
});
