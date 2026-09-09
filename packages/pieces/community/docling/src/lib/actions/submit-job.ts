import { createAction, Property } from "@activepieces/pieces-framework";
import { doclingAuth, authFromCtx } from "../auth.js";
import { DoclingError } from "../errors.js";
import { normalizeFile } from "../files.js";
import { buildOptions, convertProps } from "../options.js";
import { submitJob, type DoclingSource } from "../client.js";
import { jobOutputFields } from "../output-schemas.js";

export const submitJobAction = createAction({
  auth: doclingAuth,
  name: "submit_job",
  displayName: "Submit Job",
  description:
    "Submits a document conversion as an async job and returns its task id (no waiting). Pair with “Get Result”.",
  audience: "both",
  aiMetadata: {
    description:
      "Starts a background document conversion on docling-serve and returns a task id. Non-idempotent (each call starts a new job). Use with “Get Result” for long-running conversions.",
    idempotent: false,
  },
  outputSchema: { fields: jobOutputFields },
  props: {
    file: Property.File({ displayName: "File", required: false, description: "Document to convert (leave one of file/url empty)." }),
    url: Property.ShortText({ displayName: "URL", required: false, description: "Document URL (leave one of file/url empty)." }),
    format: convertProps.format,
    ocr: convertProps.ocr,
    table_mode: convertProps.table_mode,
    page_range: convertProps.page_range,
    image_mode: convertProps.image_mode,
  },
  run: async (ctx) => {
    const p = ctx.propsValue as Record<string, unknown>;
    const fileRaw = p.file;
    const urlRaw = typeof p.url === "string" ? p.url.trim() : "";
    let source: DoclingSource;
    if (fileRaw !== undefined && fileRaw !== null && fileRaw !== "") {
      const file = normalizeFile(fileRaw);
      source = { kind: "file", filename: file.filename, base64: file.base64 };
    } else if (urlRaw) {
      if (urlRaw.toLowerCase().endsWith(".zip")) {
        throw new DoclingError("VALIDATION", "ZIP archives are not supported.");
      }
      source = { kind: "http", url: urlRaw };
    } else {
      throw new DoclingError("VALIDATION", "Provide exactly one of file or url.");
    }
    const job = await submitJob({ auth: authFromCtx(ctx), source, options: buildOptions(p as never) });
    return {
      task_id: job.task_id,
      task_status: job.task_status,
      task_position: job.task_position ?? null,
      task_meta: job.task_meta ?? null,
    };
  },
});
