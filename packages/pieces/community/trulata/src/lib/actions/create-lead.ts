import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { trulataAuth } from '../auth';
import { trulataRequest } from '../common';

export const createLead = createAction({
  auth: trulataAuth,
  name: 'create_lead',
  displayName: 'Create Lead',
  description: 'Adds a lead to TruLata, like one you took by phone or one from another form tool.',
  props: {
    name: Property.ShortText({ displayName: 'Name', required: false }),
    email: Property.ShortText({ displayName: 'Email', required: false }),
    phone: Property.ShortText({ displayName: 'Phone', required: false }),
    service: Property.ShortText({ displayName: 'Service Asked About', required: false }),
    message: Property.LongText({ displayName: 'Message', required: false }),
    source: Property.ShortText({
      displayName: 'Source',
      description: 'Where the lead came from. Shows on the lead in TruLata.',
      required: false,
      defaultValue: 'Activepieces',
    }),
    notify: Property.Checkbox({
      displayName: 'Email the Account Owner',
      description: 'Send the usual new lead email.',
      required: false,
      defaultValue: true,
    }),
  },
  async run(context) {
    const p = context.propsValue;
    if (!p.email && !p.phone) {
      throw new Error('A lead needs an email or a phone number.');
    }
    const res = await trulataRequest<{ lead: Record<string, unknown> }>(
      context.auth.secret_text,
      HttpMethod.POST,
      '/leads',
      {
        name: p.name,
        email: p.email,
        phone: p.phone,
        service: p.service,
        message: p.message,
        source: p.source || 'Activepieces',
        notify: p.notify !== false,
      }
    );
    return res.lead;
  },
});
