import { HttpMethod } from '@activepieces/pieces-common';
import { z } from 'zod';
import { payrollClient } from './client';
import { payrollOutput } from './output';

const id = z.coerce.number().int().positive().max(2147483647);
const optionalId = z.preprocess(
  (value) => (value === '' || value === null ? undefined : value),
  id.optional()
);
const optionalText = z.preprocess(
  (value) => (value === '' || value === null ? undefined : value),
  z.string().optional()
);
const localDateTime = z.iso
  .datetime({ local: true, precision: 0 })
  .refine((value) => !/[Z+-]/.test(value.slice(10)));
const breakSchema = z.object({
  startTime: localDateTime,
  endTime: localDateTime,
  isPaidBreak: z.boolean().default(false),
});
const common = z.object({
  employeeId: id,
  locationId: optionalId,
  payCategoryId: optionalId,
  workTypeId: optionalId,
  comments: optionalText,
  externalId: optionalText,
  rate: z.number().nonnegative().optional(),
});
const inputSchema = z.discriminatedUnion('mode', [
  common.extend({
    mode: z.literal('hours'),
    startTime: localDateTime,
    endTime: localDateTime,
    breaks: z.array(breakSchema).default([]),
  }),
  common.extend({
    mode: z.literal('units'),
    date: z.iso.date(),
    units: z.number().positive(),
  }),
]);

function line(input: unknown) {
  const parsed = inputSchema.parse(input);
  const { mode: _entryMode, ...values } = parsed;
  if (parsed.mode === 'units') {
    const { mode: _mode, date, ...quantity } = parsed;
    return {
      ...quantity,
      startTime: `${date}T00:00:00`,
      endTime: `${date}T00:00:00`,
      breaks: [],
      source: 'API',
    };
  }
  if (parsed.endTime <= parsed.startTime)
    throw new Error(
      'End time must be after start time. Use local times in the payroll business time zone.'
    );
  const sortedBreaks = [...parsed.breaks].sort((a, b) =>
    a.startTime.localeCompare(b.startTime)
  );
  for (const [index, entry] of sortedBreaks.entries()) {
    const previous = sortedBreaks[index - 1];
    if (
      entry.endTime <= entry.startTime ||
      entry.startTime < parsed.startTime ||
      entry.endTime > parsed.endTime ||
      (previous && entry.startTime < previous.endTime)
    ) {
      throw new Error(
        'Breaks must be within the shift, have a positive duration, and not overlap.'
      );
    }
  }
  return { ...values, source: 'API' };
}

async function create({
  apiKey,
  businessId,
  input,
  preventDuplicates,
}: WriteParams & { preventDuplicates: boolean }) {
  const body = line(input);
  if (preventDuplicates && !body.externalId)
    throw new Error(
      'Provide an External ID when duplicate prevention is enabled. Reuse that ID when retrying the same source record.'
    );
  const result = await payrollClient.request({
    apiKey,
    path: payrollClient.businessPath({ businessId, resource: 'timesheet' }),
    method: HttpMethod.POST,
    body,
    queryParams: { enforceUniqueExternalId: String(preventDuplicates) },
  });
  return payrollOutput.flatten(payrollClient.record(result));
}

async function update({
  apiKey,
  businessId,
  timesheetId,
  input,
}: WriteParams & { timesheetId: unknown }) {
  const body = line(input);
  const path = payrollClient.businessPath({
    businessId,
    resource: `timesheet/${payrollClient.id(timesheetId)}`,
  });
  const existing = payrollClient.record(
    await payrollClient.request({ apiKey, path })
  );
  const defined = Object.fromEntries(
    Object.entries(body).filter(([, value]) => value !== undefined)
  );
  const replacement = {
    ...existing,
    ...defined,
    ...('units' in body ? {} : { units: null }),
  };
  const result = await payrollClient.request({
    apiKey,
    path,
    method: HttpMethod.PUT,
    body: replacement,
  });
  return payrollOutput.flatten(payrollClient.record(result));
}

async function bulkCreate({
  apiKey,
  businessId,
  inputs,
  approved,
}: {
  apiKey: string;
  businessId: unknown;
  inputs: unknown;
  approved: boolean;
}) {
  const lines = z.array(inputSchema).min(1).max(100).parse(inputs).map(line);
  const timesheets: Record<string, typeof lines> = {};
  const externalIds = new Set<string>();
  for (const entry of lines) {
    const key = String(entry.employeeId);
    if (entry.externalId) {
      const dedupKey = `${key}:${entry.externalId}`;
      if (externalIds.has(dedupKey))
        throw new Error(
          'The batch contains repeated External IDs for the same employee.'
        );
      externalIds.add(dedupKey);
    }
    timesheets[key] = [...(timesheets[key] ?? []), entry];
  }
  const result = await payrollClient.request({
    apiKey,
    path: payrollClient.businessPath({
      businessId,
      resource: 'timesheet/bulk',
    }),
    method: HttpMethod.POST,
    body: {
      timesheets,
      approved,
      employeeIdType: 'Standard',
      locationIdType: 'Standard',
      workTypeIdType: 'Standard',
      returnResponse: true,
      replaceExisting: false,
    },
  });
  const response = z
    .object({
      timesheets: z.record(z.string(), z.array(z.record(z.string(), z.json()))),
    })
    .parse(result);
  const created = Object.values(response.timesheets).flat();
  if (created.length !== lines.length) {
    throw new Error(
      `Payroll returned ${created.length} records for ${
        lines.length
      } submitted lines. Do not resubmit the batch until you reconcile the returned IDs: ${created
        .map((record) => record['id'])
        .join(', ')}.`
    );
  }
  return payrollOutput.rows(created);
}

export const payrollTimesheets = { line, create, update, bulkCreate };
type WriteParams = { apiKey: string; businessId: unknown; input: unknown };
