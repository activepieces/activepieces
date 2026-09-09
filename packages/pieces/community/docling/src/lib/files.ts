import { Buffer } from "node:buffer";
import { DoclingError } from "./errors.js";

export interface NormalizedFile {
  filename: string;
  extension?: string;
  base64: string;
}

const MIME_TO_EXT: Record<string, string> = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.ms-powerpoint": "ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "image/png": "png",
  "image/jpeg": "jpeg",
  "image/webp": "webp",
  "image/tiff": "tiff",
  "text/html": "html",
  "text/markdown": "md",
  "text/plain": "txt",
  "text/csv": "csv",
  "application/zip": "zip",
};

function extOf(filename: string): string | undefined {
  const dot = filename.lastIndexOf(".");
  return dot > 0 ? filename.slice(dot + 1).toLowerCase() : undefined;
}

function fromDataUri(uri: string): NormalizedFile {
  const m = /^data:([^;,]+)?(?:;base64)?,([\s\S]+)$/.exec(uri);
  if (!m) {
    throw new DoclingError("BAD_FILE", `Expected a file data URI, got: ${uri.slice(0, 64)}…`);
  }
  const mime = (m[1] ?? "application/octet-stream").toLowerCase();
  const ext = MIME_TO_EXT[mime];
  return {
    filename: `document.${ext ?? "bin"}`,
    extension: ext,
    base64: m[2],
  };
}

export function normalizeFile(value: unknown): NormalizedFile {
  if (typeof value === "string") return fromDataUri(value);

  if (value && typeof value === "object") {
    const v = value as { filename?: unknown; data?: unknown; extension?: unknown };
    const filename = typeof v.filename === "string" ? v.filename : "document.bin";
    let base64: string | undefined;
    if (typeof v.data === "string") {
      base64 = v.data; // host hydration: base64 string
    } else if (Buffer.isBuffer(v.data)) {
      base64 = v.data.toString("base64"); // real ApFile (Activepieces runtime)
    } else if (
      v.data &&
      typeof v.data === "object" &&
      (v.data as { type?: unknown }).type === "Buffer" &&
      Array.isArray((v.data as { data?: unknown }).data)
    ) {
      base64 = Buffer.from((v.data as { data: number[] }).data).toString("base64"); // JSON-IPC
    }
    if (base64 === undefined) {
      throw new DoclingError(
        "BAD_FILE",
        `Unsupported file data shape in "${filename}" (expected Buffer, base64 string, or Buffer-shaped object).`,
      );
    }
    return {
      filename,
      extension: typeof v.extension === "string" ? v.extension : extOf(filename),
      base64,
    };
  }

  throw new DoclingError("BAD_FILE", "Expected a file value (ApFile object, plain object, or data URI string).");
}
