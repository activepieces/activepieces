import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { closeAuth } from '../../auth';
import { closeClient } from '../../common/client';
import { closeMappers } from '../../common/mappers';
import { closeOutputSchemas } from '../../common/output-schemas';

const sendSms = createAction({
  auth: closeAuth,
  name: 'send_sms',
  classification: 'WRITE',
  displayName: 'Send SMS',
  description: 'Send a real text message (not just a log entry) to a lead from a Close phone number.',
  audience: 'ai',
  aiMetadata: {
    description: 'Sends a real SMS right away (Close status outbox) from one of your Close phone numbers to a lead or contact, and records it on lead leadId (lead_...). The message reaches the recipient and costs Close SMS credit; it cannot be recalled. localPhone must be an internal Close number in E.164 (e.g. +16505551234); remotePhone is the recipient in E.164; text is the message. Optional contactId (cont_...). Each call sends another SMS. Returns the SMS activity (status outbox until delivered).',
    idempotent: false,
  },
  outputSchema: closeOutputSchemas.activity,
  props: {
    leadId: Property.ShortText({ displayName: 'Lead ID', required: true }),
    localPhone: Property.ShortText({ displayName: 'From (Close number)', required: true }),
    remotePhone: Property.ShortText({ displayName: 'To (phone)', required: true }),
    text: Property.LongText({ displayName: 'Message', required: true }),
    contactId: Property.ShortText({ displayName: 'Contact ID', required: false }),
  },
  async run({ auth, propsValue }) {
    const body = {
      lead_id: closeClient.closeId({ value: propsValue.leadId, label: 'Lead ID', prefix: 'lead' }),
      contact_id: closeClient.optionalCloseId({ value: propsValue.contactId, label: 'Contact ID', prefix: 'cont' }),
      status: 'outbox',
      direction: 'outbound',
      local_phone: e164({ value: propsValue.localPhone, label: 'From (Close number)' }),
      remote_phone: e164({ value: propsValue.remotePhone, label: 'To (phone)' }),
      text: closeClient.requiredText({ value: propsValue.text, label: 'Message' }),
    };
    const result = await closeClient.request({
      auth,
      method: HttpMethod.POST,
      path: '/activity/sms/',
      body: Object.fromEntries(Object.entries(body).filter(([, v]) => v !== undefined)),
    });
    return closeMappers.activity(result);
  },
});

function e164({ value, label }: { value: unknown; label: string }): string {
  const text = closeClient.requiredText({ value, label }).replace(/[\s().-]/g, '');
  if (!/^\+[1-9]\d{6,14}$/.test(text)) throw new Error(`${label} must be a phone number in E.164 format, e.g. +16505551234.`);
  return text;
}

export { sendSms };
