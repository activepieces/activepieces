import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { weincAuth } from '../auth';
import { compact, weincRequest, WeincClient } from '../common/client';

export const createClient = createAction({
  auth: weincAuth,
  name: 'create_client',
  displayName: 'Create Client',
  description: 'Adds a client to your organization.',
  audience: 'both',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Adds a new client (by email) to the WeInc organization, optionally with a name, company and one of the organization plans. Not idempotent: fails or duplicates if the client already exists.',
    idempotent: false,
  },
  props: {
    email: Property.ShortText({ displayName: 'Email', required: true }),
    name: Property.ShortText({ displayName: 'Name', required: false }),
    company: Property.ShortText({ displayName: 'Company', required: false }),
    planId: Property.ShortText({
      displayName: 'Plan ID',
      description: 'Optional ID of one of your organization plans.',
      required: false,
    }),
  },
  async run(context) {
    const { email, name, company, planId } = context.propsValue;
    const res = await weincRequest<{ client: WeincClient }>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/clients',
      body: compact({ email, name, company, plan_id: planId }),
    });
    return res.client;
  },
});
