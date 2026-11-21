import { createAction, OutputSchema, Property } from '@activepieces/pieces-framework';
import { sprinklrAuth } from '../auth';
import { sprinklrErrors } from '../common/errors';
import { sprinklrReports } from '../common/reports';
import { sprinklrTime } from '../common/time';

const PAGE_SIZE_CAP = 1000;

function parsePayload(value: unknown): Record<string, unknown> {
  let parsed: unknown = value;
  if (typeof value === 'string') {
    if (value.trim().length === 0) {
      throw new Error('Report Payload is empty. Paste the payload from "Generate API v2 Payload" on a Sprinklr widget.');
    }
    try {
      parsed = JSON.parse(value);
    } catch {
      throw new Error('Report Payload is not valid JSON. Copy it again from "Generate API v2 Payload" on the Sprinklr widget.');
    }
  }
  if (!sprinklrErrors.isRecord(parsed) || Object.keys(parsed).length === 0) {
    throw new Error('Report Payload must be a JSON object. Copy it from "Generate API v2 Payload" on the Sprinklr widget.');
  }
  return parsed;
}

function wholeNumber({ value, field }: { value: unknown; field: string }): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0) {
    throw new Error(`${field} must be a whole number of 0 or more.`);
  }
  return n;
}

function buildBody({
  payload,
  startTime,
  endTime,
  page,
  pageSize,
}: {
  payload: unknown;
  startTime: unknown;
  endTime: unknown;
  page: unknown;
  pageSize: unknown;
}): Record<string, unknown> {
  const body: Record<string, unknown> = { ...parsePayload(payload) };
  const start = sprinklrTime.toEpochMs({ value: startTime, field: 'Start Time' });
  const end = sprinklrTime.toEpochMs({ value: endTime, field: 'End Time' });
  const pageValue = wholeNumber({ value: page, field: 'Page' });
  const pageSizeValue = wholeNumber({ value: pageSize, field: 'Page Size' });
  if (start !== undefined) {
    body['startTime'] = start;
  }
  if (end !== undefined) {
    body['endTime'] = end;
  }
  if (pageValue !== undefined) {
    body['page'] = pageValue;
  }
  if (pageSizeValue !== undefined) {
    body['pageSize'] = pageSizeValue;
  }
  if (typeof body['pageSize'] === 'number' && body['pageSize'] > PAGE_SIZE_CAP) {
    body['pageSize'] = PAGE_SIZE_CAP;
  }
  body['jsonResponse'] = true;
  return body;
}

function readRows(data: unknown): { rows: Record<string, unknown>[]; hasMore: boolean } {
  if (Array.isArray(data)) {
    return { rows: data.filter(sprinklrErrors.isRecord), hasMore: false };
  }
  if (!sprinklrErrors.isRecord(data)) {
    return { rows: [], hasMore: false };
  }
  const hasMore = data['hasMore'] === true;
  const inner = data['data'] ?? data['rows'];
  if (!Array.isArray(inner)) {
    return { rows: [], hasMore };
  }
  const headings = Array.isArray(data['headings']) ? data['headings'].map(String) : undefined;
  const rows = inner.flatMap((row): Record<string, unknown>[] => {
    if (sprinklrErrors.isRecord(row)) {
      return [row];
    }
    if (Array.isArray(row) && headings) {
      return [Object.fromEntries(headings.map((heading, i) => [heading, row[i]]))];
    }
    return [{ values: Array.isArray(row) ? row : [row] }];
  });
  return { rows, hasMore };
}

const outputSchema: OutputSchema = {
  fields: [
    { key: 'rowCount', label: 'Row Count', format: 'number' },
    { key: 'hasMore', label: 'Has More Rows', format: 'boolean' },
    { key: 'rows', label: 'Rows' },
  ],
};

export const runReportAction = createAction({
  auth: sprinklrAuth,
  name: 'run_report',
  classification: 'SEARCH',
  displayName: 'Run Report',
  description: 'Runs a reporting query and returns its rows.',
  audience: 'both',
  aiMetadata: {
    description:
      'Run a Sprinklr reporting query from a payload copied out of a Sprinklr dashboard widget ("Generate API v2 Payload") and return its rows as objects keyed by column heading. Do not write a payload from scratch; optionally override the time window and page. Read-only and safe to retry; use hasMore with Page to read further pages.',
    idempotent: true,
  },
  props: {
    payload: Property.Json({
      displayName: 'Report Payload',
      description: 'On a Sprinklr widget, use "Generate API v2 Payload" and paste.',
      required: true,
    }),
    start_time: Property.DateTime({
      displayName: 'Start Time',
      description: 'Replaces the start time in the payload.',
      required: false,
      advanced: true,
    }),
    end_time: Property.DateTime({
      displayName: 'End Time',
      description: 'Replaces the end time in the payload.',
      required: false,
      advanced: true,
    }),
    page: Property.Number({
      displayName: 'Page',
      description: 'Page to read, starting at 0. Replaces the payload page.',
      required: false,
      display: 'stepper',
      min: 0,
      step: 1,
      advanced: true,
    }),
    page_size: Property.Number({
      displayName: 'Page Size',
      description: 'Rows per page, up to 1,000.',
      required: false,
      display: 'stepper',
      min: 1,
      max: PAGE_SIZE_CAP,
      step: 1,
      advanced: true,
    }),
  },
  async run(context) {
    const p = context.propsValue;
    const body = buildBody({
      payload: p.payload,
      startTime: p.start_time,
      endTime: p.end_time,
      page: p.page,
      pageSize: p.page_size,
    });
    const data = await sprinklrReports.query({ auth: context.auth, body });
    const { rows, hasMore } = readRows(data);
    return { rowCount: rows.length, hasMore, rows };
  },
  outputSchema,
});
