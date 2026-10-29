import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { closeAuth } from '../../auth';
import { closeClient } from '../../common/client';
import { closeMappers } from '../../common/mappers';
import { closeOutputSchemas } from '../../common/output-schemas';

const logEmail = createAction({
  auth: closeAuth,
  name: 'log_email',
  classification: 'WRITE',
  displayName: 'Log Email',
  description: 'Record an email that was already sent or received, without sending anything.',
  audience: 'ai',
  aiMetadata: {
    description: 'Records an email that already happened as an email activity on one Close lead (leadId, lead_...). It never sends an email. direction: sent (the user emailed the lead, status sent) or received (the lead emailed the user, status inbox; sender is then required). Pass subject and bodyText; optional to (list of addresses), sender ("Name <a@b.com>"), contactId (cont_...), activityAt (ISO 8601). Creates a new activity on every call. Returns the email activity.',
    idempotent: false,
  },
  outputSchema: closeOutputSchemas.activity,
  props: {
    leadId: Property.ShortText({ displayName: 'Lead ID', required: true }),
    direction: Property.StaticDropdown({
      displayName: 'Direction',
      required: true,
      options: { options: [{ label: 'Sent (to the lead)', value: 'sent' }, { label: 'Received (from the lead)', value: 'received' }] },
    }),
    subject: Property.ShortText({ displayName: 'Subject', required: true }),
    bodyText: Property.LongText({ displayName: 'Body', required: true }),
    to: Property.Array({ displayName: 'To', required: false }),
    sender: Property.ShortText({ displayName: 'Sender', required: false }),
    contactId: Property.ShortText({ displayName: 'Contact ID', required: false }),
    activityAt: Property.DateTime({ displayName: 'Activity At', required: false }),
  },
  async run({ auth, propsValue }) {
    const direction = closeClient.requiredText({ value: propsValue.direction, label: 'Direction' });
    if (direction !== 'sent' && direction !== 'received') throw new Error('Direction must be sent or received.');
    const sender = closeClient.optionalText(propsValue.sender);
    if (direction === 'received' && sender === undefined) throw new Error('Sender is required for a received email.');
    const body = {
      lead_id: closeClient.closeId({ value: propsValue.leadId, label: 'Lead ID', prefix: 'lead' }),
      status: direction === 'sent' ? 'sent' : 'inbox',
      subject: closeClient.requiredText({ value: propsValue.subject, label: 'Subject' }),
      body_text: closeClient.requiredText({ value: propsValue.bodyText, label: 'Body' }),
      to: closeClient.stringList({ value: propsValue.to, label: 'To' }),
      sender,
      contact_id: closeClient.optionalCloseId({ value: propsValue.contactId, label: 'Contact ID', prefix: 'cont' }),
      activity_at: closeClient.isoDateTime({ value: propsValue.activityAt, label: 'Activity At' }),
    };
    const result = await closeClient.request({
      auth,
      method: HttpMethod.POST,
      path: '/activity/email/',
      body: Object.fromEntries(Object.entries(body).filter(([, v]) => v !== undefined)),
    });
    return closeMappers.activity(result);
  },
});

export { logEmail };
