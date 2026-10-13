import { isRecord } from "./values";
import type { FormShape, WireOperation } from "./types";
const empty = (value: unknown) =>
  value === undefined || value === null || value === "";
const structuredEmpty = (value: unknown) =>
  empty(value) ||
  (typeof value === "object" && Object.keys(value ?? {}).length === 0);

function compact(value: unknown): unknown {
  if (empty(value)) return undefined;
  if (Array.isArray(value)) {
    const rows = value.map(compact).filter((item) => item !== undefined);
    return rows.length ? rows : undefined;
  }
  if (isRecord(value)) {
    const entries = Object.entries(value)
      .map(([key, item]) => [key, compact(item)])
      .filter(([, item]) => item !== undefined);
    return entries.length ? Object.fromEntries(entries) : undefined;
  }
  return value;
}

function readNode(
  node: FormShape,
  key: string,
  values: Record<string, unknown>,
  forcedMode: unknown,
): unknown {
  const mode = forcedMode ?? values[`${key}__input_mode`];
  if (mode && mode !== "fields" && mode !== "json")
    throw new Error(`${node.label} has an invalid input method.`);
  const raw = values[key];
  const override =
    node.kind === "dictionary" && !forcedMode ? values[`${key}__json`] : raw;
  if (mode === "json") return empty(override) ? undefined : override;
  if (
    node.kind === "dictionary" &&
    (mode === "fields" || values[`${key}__enabled`] === true)
  )
    return empty(raw) ? undefined : raw;
  if (!mode && !structuredEmpty(raw)) return raw;
  if (
    node.kind === "dictionary" ||
    !["object", "array", "template-components"].includes(node.kind)
  )
    return structuredEmpty(raw) ? undefined : raw;
  if (node.kind === "object") {
    const entries = (node.children ?? [])
      .map((child) => [
        child.name,
        readNode(child, `${key}__${child.name}`, values, forcedMode),
      ])
      .filter(([, value]) => value !== undefined);
    return entries.length ? Object.fromEntries(entries) : undefined;
  }
  if (node.kind === "array" || node.kind === "template-components") {
    const rows = values[`${key}__rows`];
    if (structuredEmpty(rows)) return undefined;
    if (!Array.isArray(rows))
      throw new Error(`${node.label} rows must be an array.`);
    const fileRows =
      node.name === "attachments"
        ? rows.map((row) => {
            if (!isRecord(row) || !isRecord(row["content"])) return row;
            const file = row["content"];
            if (
              typeof file["base64"] !== "string" ||
              typeof file["filename"] !== "string"
            )
              throw new Error("Choose a valid file for each attachment.");
            return {
              ...row,
              content: file["base64"],
              filename: empty(row["filename"])
                ? file["filename"]
                : row["filename"],
            };
          })
        : rows;
    const cleaned = compact(fileRows);
    if (!Array.isArray(cleaned)) return undefined;
    if (node.kind === "template-components") {
      return [
        {
          type: "body",
          parameters: cleaned.map((row) => {
            if (
              !isRecord(row) ||
              typeof row["text"] !== "string" ||
              !row["text"]
            )
              throw new Error("Each template variable needs a text value.");
            return {
              type: "text",
              text: row["text"],
              ...(empty(row["name"]) ? {} : { name: row["name"] }),
            };
          }),
        },
      ];
    }
    if (node.item?.kind === "object") {
      return cleaned.map((item) => {
        const row = isRecord(item) ? item : {};
        return Object.fromEntries(
          (node.item?.children ?? []).flatMap((child) => {
            if (empty(row[child.name])) {
              if (child.required)
                throw new Error(
                  `${node.label}: ${child.label} is required in each row.`,
                );
              return [];
            }
            return [[child.name, row[child.name]]];
          }),
        );
      });
    }
    return cleaned
      .map((row) => (isRecord(row) ? row["value"] : undefined))
      .filter((value) => !empty(value));
  }
  return undefined;
}

export function normalizeFormProps(
  operation: WireOperation,
  props: Record<string, unknown>,
): Record<string, unknown> {
  if (!operation.fields.some((field) => field.form)) return props;
  const modes = operation.contentModes ?? [];
  const mode = props["content_mode"]
    ? modes.find((mode) => mode.value === props["content_mode"])
    : undefined;
  if (props["content_mode"] && !mode)
    throw new Error("Choose a supported message content type.");
  const values = {
    ...props,
    ...(isRecord(props["content"]) ? props["content"] : {}),
    ...Object.assign(
      {},
      ...operation.fields.map((field) => {
        const input = props[`${field.key}__input`];
        return isRecord(input) ? input : {};
      }),
    ),
  };
  if (props["content_input_mode"] !== "json") {
    if (props["content_mode"] === "template_slug")
      delete values["body_template__id"];
    else if (
      props["content_mode"] === "template" &&
      !empty(values["body_template__id"])
    )
      delete values["body_template__slug"];
  }
  const branchFields = new Set(modes.flatMap((mode) => mode.fields));
  const result: Record<string, unknown> = {};
  for (const field of operation.fields) {
    if (values[`${field.key}__enabled`] === false) continue;
    if (
      field.key === "body_parameters" &&
      branchFields.has(field.key) &&
      values[`${field.key}__enabled`] !== true
    )
      continue;
    if (mode && branchFields.has(field.key) && !mode.fields.includes(field.key))
      continue;
    const directListArray =
      isListOperation(operation) &&
      field.location === "query" &&
      field.encoding === "array" &&
      Object.hasOwn(values, field.key);
    const value = directListArray
      ? values[field.key]
      : field.form
        ? readNode(
            field.form,
            field.key,
            values,
            branchFields.has(field.key)
              ? props["content_input_mode"]
              : isRecord(props[`${field.key}__input`])
                ? (props[`${field.key}__input_mode`] ?? "fields")
                : undefined,
          )
        : values[field.key];
    if (value !== undefined) result[field.key] = value;
  }
  return result;
}

export function isListOperation(operation: WireOperation): boolean {
  return (
    operation.method === "GET" &&
    operation.fields.some(
      (field) => field.location === "query" && field.wireName === "limit",
    )
  );
}
