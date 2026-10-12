import { birdHttpClient } from "./http";
import {
  createAction,
  type OutputSchemaField,
} from "@activepieces/pieces-framework";
import definitions from "../../../generated/operations.json";
import { birdAuth } from "../auth";
import { actionForm } from "./properties";
import { isListOperation } from "./forms";
import { credentialForAuth, executeOperation } from "./request";
import type { Operation } from "./types";

export function createBirdAction(name: string) {
  const definition = definitions.operations.find(
    (operation) => operation.name === name,
  );
  if (!definition) throw new Error(`Unknown generated Bird action: ${name}`);
  const operation: Operation = {
    ...definition,
    outputSchema: {
      ...definition.outputSchema,
      fields: definition.outputSchema.fields.map(outputField),
    },
  };
  return createAction({
    name: operation.name,
    displayName: operation.label,
    description: operation.summary,
    auth: birdAuth,
    ...actionForm(operation),
    outputSchema: operation.outputSchema,
    classification: isListOperation(operation)
      ? "SEARCH"
      : operation.method === "GET"
        ? "READ"
        : "WRITE",
    audience: "both",
    aiMetadata: {
      description: chooserDescription(operation),
      idempotent: operation.method === "GET",
    },
    errorHandlingOptions: {
      retryOnFailure: { defaultValue: false, hide: false },
      continueOnFailure: { defaultValue: false, hide: false },
    },
    async run(context) {
      return executeOperation(operation, {
        accessToken: credentialForAuth(context.auth),
        props: context.propsValue,
        httpClient: birdHttpClient,
      });
    },
  });
}

function chooserDescription(operation: Operation): string {
  if (isListOperation(operation))
    return `${operation.summary} Filter messages and return one page with pagination cursors. Map next_cursor to Next page cursor to read another page. This is a read-only request.`;
  if (operation.method === "GET")
    return `${operation.summary} Use the message ID returned by the matching send action to read its current delivery status. This is a read-only request; accepted and delivered are different states.`;
  if (operation.name === "verify_verifications_create")
    return `${operation.summary} Use an email address, phone number or both to start a verification and deliver a passcode. Keep the same original recipient set for later checks and channel fallback. This action sends a message and changes verification state.`;
  if (operation.name === "verify_verifications_check")
    return `${operation.summary} Supply the original recipient set and the received code as text, retaining leading zeroes. A successful HTTP request can return success:false for an incorrect code. Checking can consume an attempt or complete a verification.`;
  if (operation.name === "verify_verifications_next_channel")
    return `${operation.summary} Supply the same original recipient set to send the existing verification through its next configured channel. This sends a message and changes verification state; it does not create a new recipient set.`;
  return `${operation.summary} Supply the sender where required, the recipient and message content or a template. The response confirms acceptance, not delivery; use the matching get action with its returned ID. This sends a message and may incur charges. A stable caller-supplied Idempotency-Key is needed for deliberate retries; do not assume repeated calls are idempotent.`;
}

function outputField(field: ProjectedOutputField): OutputSchemaField {
  const { format, children, listItems, ...base } = field;
  return {
    ...base,
    ...(format === undefined ? {} : { format: outputFormat(format) }),
    ...(children ? { children: children.map(outputField) } : {}),
    ...(listItems ? { listItems: listItems.map(outputField) } : {}),
  };
}

function outputFormat(format: string): OutputSchemaField["format"] {
  switch (format) {
    case "email":
    case "url":
    case "date":
    case "datetime":
    case "number":
    case "boolean":
    case "image":
    case "html":
    case "currency":
    case "filesize":
    case "duration":
      return format;
    default:
      throw new Error(`Unsupported generated output format: ${format}`);
  }
}

type ProjectedOutputField = Omit<
  OutputSchemaField,
  "format" | "children" | "listItems"
> & {
  format?: string;
  children?: ProjectedOutputField[];
  listItems?: ProjectedOutputField[];
};
