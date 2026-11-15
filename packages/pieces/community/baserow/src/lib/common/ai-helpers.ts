import { HttpError } from '@activepieces/pieces-common';
import { tryCatch } from '@activepieces/pieces-framework';
import { baserowAuthHelpers, BaserowAuthValue } from '../auth';
import { BaserowClient } from './client';
import { BaserowField } from './types';

export const baserowAiHelpers = {
  assertJwt,
  assertSelectOptionsAllowed,
  execute,
  toRecord,
  toRecordArray,
  toIdArray,
  resolveField,
  BATCH_LIMIT: 200,
};

function assertJwt({
  auth,
  actionName,
}: {
  auth: BaserowAuthValue;
  actionName: string;
}): void {
  if (!baserowAuthHelpers.isJwtAuth(auth)) {
    throw new Error(
      `${actionName} requires a Baserow connection that uses Email & Password. Database Tokens can only read and write rows. Reconnect Baserow with Email & Password to use this action.`
    );
  }
}

function assertSelectOptionsAllowed({
  auth,
  createMissingSelectOptions,
}: {
  auth: BaserowAuthValue;
  createMissingSelectOptions: boolean | undefined;
}): void {
  if (createMissingSelectOptions && !baserowAuthHelpers.isJwtAuth(auth)) {
    throw new Error(
      'Creating missing select options edits the field and requires a Baserow connection that uses Email & Password. Turn the option off, or reconnect Baserow with Email & Password.'
    );
  }
}

async function execute<T>(request: () => Promise<T>): Promise<T> {
  const { data, error } = await tryCatch(request);
  if (error) {
    throw new Error(describeError(error));
  }
  return data;
}

function toRecord({ value, propName }: { value: unknown; propName: string }): Record<string, unknown> {
  if (isRecord(value)) {
    return value;
  }
  throw new Error(`${propName} must be a JSON object.`);
}

function toRecordArray({
  value,
  propName,
  max,
}: {
  value: unknown;
  propName: string;
  max: number;
}): Record<string, unknown>[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`${propName} must be a non-empty JSON array of objects.`);
  }
  if (value.length > max) {
    throw new Error(`${propName} accepts at most ${max} items per call; received ${value.length}.`);
  }
  return value.map((item, index) => {
    if (!isRecord(item)) {
      throw new Error(`${propName}[${index}] must be a JSON object.`);
    }
    return item;
  });
}

function toIdArray({
  value,
  propName,
  max,
}: {
  value: unknown[] | undefined;
  propName: string;
  max: number;
}): number[] {
  if (!value || value.length === 0) {
    throw new Error(`${propName} must contain at least one ID.`);
  }
  if (value.length > max) {
    throw new Error(`${propName} accepts at most ${max} IDs per call; received ${value.length}.`);
  }
  return value.map((item) => {
    const id = Number(item);
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error(`${propName} contains an invalid ID: ${String(item)}.`);
    }
    return id;
  });
}

async function resolveField({
  client,
  tableId,
  fieldName,
}: {
  client: BaserowClient;
  tableId: number;
  fieldName: string;
}): Promise<BaserowField> {
  const fields = await client.listTableFields(tableId);
  const field = fields.find((f) => f.name === fieldName);
  if (!field) {
    throw new Error(
      `Field "${fieldName}" was not found in table ${tableId}. Available fields: ${fields.map((f) => f.name).join(', ')}.`
    );
  }
  return field;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function describeError(error: unknown): string {
  if (!(error instanceof HttpError)) {
    return error instanceof Error ? error.message : String(error);
  }
  const { status, body } = error.response;
  const detail = extractDetail(body);
  switch (status) {
    case 400:
      return `Baserow rejected the request: ${detail}`;
    case 401:
      return `Baserow authentication failed. Check the connection credentials. ${detail}`;
    case 402:
      return `This Baserow feature requires a Premium or higher plan. ${detail}`;
    case 403:
      return `The Baserow connection does not have permission for this operation. ${detail}`;
    case 404:
      return `The Baserow resource was not found. Check the IDs. ${detail}`;
    case 429:
      return `Baserow rate limit reached. Retry after a short wait. ${detail}`;
    default:
      return `Baserow request failed with status ${status}: ${detail}`;
  }
}

function extractDetail(body: unknown): string {
  if (isRecord(body)) {
    const code = typeof body['error'] === 'string' ? body['error'] : '';
    const detail = body['detail'];
    const detailText = typeof detail === 'string' ? detail : detail === undefined ? '' : JSON.stringify(detail);
    return [code, detailText].filter((part) => part.length > 0).join(' — ');
  }
  return typeof body === 'string' ? body : JSON.stringify(body);
}
