import { createAction, Property } from '@activepieces/pieces-framework';
import { vapiAuth } from '../auth';
import { vapiUtils } from '../common/vapi-api';
import { vapiFlatten } from '../common/flatten';
import { vapiOutputSchemas } from '../common/output-schemas';
import { callQuery } from './list-calls';

const FINDER_SCAN_LIMIT = 1000;

function digitsOf(value: string): string {
  return value.replace(/\D/g, '');
}

export const findCalls = createAction({
  auth: vapiAuth,
  name: 'find_calls',
  classification: 'SEARCH',
  displayName: 'Find Calls',
  description: 'Find recent calls by assistant, phone number, customer number or creation date.',
  audience: 'ai',
  outputSchema: vapiOutputSchemas.findCalls,
  aiMetadata: {
    description:
      'Finds recent Vapi calls, newest first, and returns for each: call ID, status, ended reason, customer number, creation time and cost. Optional filters: assistant ID, phone number ID, created after (ISO 8601), and customer number. The customer number filter is applied by this tool to the 1000 most recent calls matching the other filters, because Vapi cannot filter by it. Pass a call ID to Get Call Result for the transcript and summary. Read-only.',
    idempotent: true,
  },
  props: {
    assistantId: Property.ShortText({ displayName: 'Assistant ID', required: false }),
    phoneNumberId: Property.ShortText({ displayName: 'Phone Number ID', required: false }),
    customerNumber: Property.ShortText({ displayName: 'Customer Number', description: 'E.164 number of the person called.', required: false }),
    createdAfter: Property.ShortText({ displayName: 'Created After', description: 'ISO 8601 date-time, e.g. 2026-01-31T00:00:00Z.', required: false }),
    limit: Property.Number({ displayName: 'Limit', description: 'Maximum calls to return (1-100). Defaults to 20.', required: false }),
  },
  async run(context) {
    const { assistantId, phoneNumberId, customerNumber, createdAfter, limit } = context.propsValue;
    const max = vapiUtils.clampLimit({ value: limit, defaultValue: 20, max: 100 });
    const numberDigits = customerNumber ? digitsOf(customerNumber) : '';
    if (customerNumber && customerNumber.trim() !== '' && numberDigits === '') {
      throw new Error('Customer Number must contain digits, e.g. +14155551234.');
    }
    if (assistantId) vapiUtils.requireId({ value: assistantId, fieldName: 'Assistant ID' });
    if (phoneNumberId) vapiUtils.requireId({ value: phoneNumberId, fieldName: 'Phone Number ID' });
    const calls = await callQuery.query({
      apiKey: context.auth.secret_text,
      assistantId: assistantId ?? undefined,
      phoneNumberId: phoneNumberId ?? undefined,
      createdAfter: createdAfter ?? undefined,
      limit: numberDigits === '' ? max : FINDER_SCAN_LIMIT,
    });
    const matching = calls.map((call) => vapiFlatten.callSummary(call)).filter(
      (call) => numberDigits === '' || (call.customerNumber !== null && digitsOf(call.customerNumber) === numberDigits)
    );
    return { calls: matching.slice(0, max) };
  },
});
