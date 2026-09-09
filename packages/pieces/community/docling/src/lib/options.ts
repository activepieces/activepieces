import { Property } from "@activepieces/pieces-framework";
import { DoclingError } from "./errors.js";

export interface ActionOptionsProps {
  format?: "markdown" | "markdown+json" | "all";
  ocr?: boolean;
  table_mode?: "fast" | "accurate";
  page_range?: unknown;
  image_mode?: "placeholder" | "embedded" | "referenced";
  execution?: "async" | "sync";
  timeout_seconds?: number;
}

export interface ConvertDocumentsOptionsPayload {
  to_formats: string[];
  do_ocr: boolean;
  table_mode: "fast" | "accurate";
  do_table_structure: boolean;
  image_export_mode: "placeholder" | "embedded" | "referenced";
  page_range?: [number, number];
}

const FORMAT_MAP: Record<string, string[]> = {
  markdown: ["md"],
  "markdown+json": ["md", "json"],
  all: ["md", "json", "html", "text", "doctags"],
};

export function buildOptions(props: ActionOptionsProps): ConvertDocumentsOptionsPayload {
  const preset = props.format ?? "markdown";
  const to_formats = FORMAT_MAP[preset];
  if (!to_formats) {
    throw new DoclingError("VALIDATION", `Unknown format preset "${preset}".`);
  }
  const out: ConvertDocumentsOptionsPayload = {
    to_formats,
    do_ocr: props.ocr ?? true,
    table_mode: props.table_mode ?? "accurate",
    do_table_structure: true,
    image_export_mode: props.image_mode ?? "placeholder",
  };
  if (props.page_range !== undefined) {
    if (
      !Array.isArray(props.page_range) ||
      props.page_range.length !== 2 ||
      !props.page_range.every((n) => typeof n === "number" && Number.isInteger(n))
    ) {
      throw new DoclingError("VALIDATION", `page_range must be a 2-element integer array, got ${JSON.stringify(props.page_range)}.`);
    }
    const [start, end] = props.page_range as [number, number];
    if (start < 1 || end < start) {
      throw new DoclingError("VALIDATION", `page_range must be 1-based with start <= end, got [${start}, ${end}].`);
    }
    out.page_range = [start, end];
  }
  return out;
}

export function executionMode(props: ActionOptionsProps): "async" | "sync" {
  return props.execution === "sync" ? "sync" : "async";
}

export function timeoutMs(props: ActionOptionsProps): number {
  const t = props.timeout_seconds ?? 600;
  if (!Number.isFinite(t) || t < 5 || t > 3600) {
    throw new DoclingError("VALIDATION", `timeout_seconds must be between 5 and 3600, got ${t}.`);
  }
  return Math.floor(t) * 1000;
}

// Shared property definitions for the convert/chunk actions. `as const`-free
// on purpose: the framework's property types carry their own generics.
export const convertProps = {
  format: Property.StaticDropdown({
    displayName: "Output Format",
    required: true,
    defaultValue: "markdown",
    options: {
      options: [
        { label: "Markdown", value: "markdown" },
        { label: "Markdown + document model (JSON)", value: "markdown+json" },
        { label: "All (md, json, html, text, doctags)", value: "all" },
      ],
    },
  }),
  ocr: Property.Checkbox({
    displayName: "OCR",
    required: true,
    defaultValue: true,
    description: "Run OCR on the pages (server default: on).",
  }),
  table_mode: Property.StaticDropdown({
    displayName: "Table Mode",
    required: true,
    defaultValue: "accurate",
    options: {
      options: [
        { label: "Fast", value: "fast" },
        { label: "Accurate (TableFormer)", value: "accurate" },
      ],
    },
  }),
  page_range: Property.Object({
    displayName: "Page Range",
    required: false,
    description: "Optional 1-based [start, end] page window, e.g. [1, 20].",
  }),
  image_mode: Property.StaticDropdown({
    displayName: "Image Mode",
    required: true,
    defaultValue: "placeholder",
    options: {
      options: [
        { label: "Placeholder", value: "placeholder" },
        { label: "Embedded (base64 in output)", value: "embedded" },
        { label: "Referenced (URLs)", value: "referenced" },
      ],
    },
  }),
  execution: Property.StaticDropdown({
    displayName: "Execution",
    required: true,
    defaultValue: "async",
    options: {
      options: [
        { label: "Auto (async — recommended)", value: "async" },
        { label: "Sync (fast documents only; server caps at ~120 s)", value: "sync" },
      ],
    },
  }),
  timeout_seconds: Property.Number({
    displayName: "Timeout (seconds)",
    required: false,
    defaultValue: 600,
    description: "Overall deadline for async conversions (5–3600).",
  }),
};
