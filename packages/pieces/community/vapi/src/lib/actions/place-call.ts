import { createAction, Property } from '@activepieces/pieces-framework';
import { vapiAuth } from '../auth';
import { vapiUtils } from '../common/vapi-api';
import { vapiFlatten } from '../common/flatten';
import { vapiOutputSchemas } from '../common/output-schemas';
import { callStarter } from './create-call';

const E164_PATTERN = /^\+[1-9]\d{6,14}$/;

export const placeCall = createAction({
  auth: vapiAuth,
  name: 'place_call',
  classification: 'WRITE',
  displayName: 'Place Call',
  description: 'Have a Vapi assistant phone a customer.',
  audience: 'ai',
  outputSchema: vapiOutputSchemas.placedCall,
  aiMetadata: {
    description:
      'Starts a real outbound phone call in which a Vapi assistant calls a customer, and returns the new call ID right away (status is usually queued). Get the assistant ID from Find Assistant and the phone number ID from Find Phone Number. The customer number must be in E.164 format (e.g. +14155551234). Use Get Call Result with the returned ID to read the transcript and outcome after the call ends. Each run dials again and costs money: not idempotent.',
    idempotent: false,
  },
  props: {
    assistantId: Property.ShortText({ displayName: 'Assistant ID', description: 'ID of the assistant that talks on the call.', required: true }),
    phoneNumberId: Property.ShortText({ displayName: 'Phone Number ID', description: 'ID of the Vapi phone number to call from.', required: true }),
    customerNumber: Property.ShortText({ displayName: 'Customer Number', description: 'Number to call, E.164 format (e.g. +14155551234).', required: true }),
    customerName: Property.ShortText({ displayName: 'Customer Name', description: 'Optional name of the person being called.', required: false }),
    firstMessage: Property.LongText({ displayName: 'First Message', description: 'Optional opening line for this call only.', required: false }),
    variableValues: Property.LongText({
      displayName: 'Variable Values',
      description: 'Optional JSON object of values for {{variables}} in the assistant prompt, e.g. {"orderId":"123"}.',
      required: false,
    }),
  },
  async run(context) {
    const { assistantId, phoneNumberId, customerNumber, customerName, firstMessage, variableValues } = context.propsValue;
    vapiUtils.requireId({ value: assistantId, fieldName: 'Assistant ID' });
    vapiUtils.requireId({ value: phoneNumberId, fieldName: 'Phone Number ID' });
    const number = customerNumber.trim();
    if (!E164_PATTERN.test(number)) {
      throw new Error('Customer Number must be in E.164 format, e.g. +14155551234.');
    }
    const customer: Record<string, string> = { number };
    if (customerName && customerName.trim() !== '') {
      customer['name'] = customerName.trim();
    }
    const overrides: Record<string, unknown> = {};
    if (firstMessage && firstMessage !== '') {
      overrides['firstMessage'] = firstMessage;
    }
    const variables = vapiUtils.parseJsonObject({ value: variableValues, fieldName: 'Variable Values' });
    if (variables !== undefined) {
      overrides['variableValues'] = variables;
    }
    const call = await callStarter.start({
      apiKey: context.auth.secret_text,
      assistantId: assistantId.trim(),
      phoneNumberId: phoneNumberId.trim(),
      customer,
      assistantOverrides: Object.keys(overrides).length > 0 ? overrides : undefined,
    });
    return vapiFlatten.placedCall(call);
  },
});
