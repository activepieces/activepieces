import { createAction, Property } from "@activepieces/pieces-framework";
import { doclingAuth, authFromCtx } from "../auth.js";
import { DoclingError } from "../errors.js";
import { normalizeFile } from "../files.js";
import { buildOptions, convertProps, executionMode, timeoutMs } from "../options.js";
import { runChunk, type DoclingSource } from "../client.js";
import { chunkOutputFields } from "../output-schemas.js";

export const chunkAction = createAction({
  auth: doclingAuth,
  name: "chunk",
  displayName: "Chunk",
  description:
    "Splits a document from an upload or URL into chunks with a docling-serve v1 API (hybrid or hierarchical chunker) and returns the chunk texts.",
  audience: "both",
  aiMetadata: {
    description:
      "Splits a document into text chunks via docling-serve using the hybrid or hierarchical chunker. Idempotent — safe to re-run. Use for RAG / knowledge-base ingestion.",
    idempotent: true,
  },
  outputSchema: { fields: chunkOutputFields },
  props: {
    file: Property.File({ displayName: "File", required: false, description: "Document to convert (leave one of file/url empty)." }),
    url: Property.ShortText({ displayName: "URL", required: false, description: "Document URL (leave one of file/url empty)." }),
    chunker: Property.StaticDropdown({
      displayName: "Chunker",
      required: true,
      defaultValue: "hybrid",
      options: {
        options: [
          { label: "Hybrid (paragraph-level, default)", value: "hybrid" },
          { label: "Hierarchical (by document structure)", value: "hierarchical" },
        ],
      },
    }),
    ocr: convertProps.ocr,
    table_mode: convertProps.table_mode,
    page_range: convertProps.page_range,
    image_mode: convertProps.image_mode,
    execution: convertProps.execution,
    timeout_seconds: convertProps.timeout_seconds,
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
        throw new DoclingError("VALIDATION", "zip archives are not supported.");
      }
      source = { kind: "http", url: urlRaw };
    } else {
      throw new DoclingError("VALIDATION", "Provide exactly one of file or url.");
    }
    return runChunk({
      auth: authFromCtx(ctx),
      source,
      options: buildOptions(p as never),
      mode: executionMode(p as never),
      timeoutMs: timeoutMs(p as never),
      path: "chunk",
      chunker: (p.chunker as "hybrid" | "hierarchical") ?? "hybrid",
    });
  },
});
