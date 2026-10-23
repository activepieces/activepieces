import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { trulataAuth } from '../auth';
import { trulataRequest } from '../common';

export const findLead = createAction({
  auth: trulataAuth,
  name: 'find_lead',
  displayName: 'Find Lead',
  description: 'Finds leads by email or phone number.',
  props: {
    email: Property.ShortText({ displayName: 'Email', required: false }),
    phone: Property.ShortText({ displayName: 'Phone', required: false }),
  },
  async run(context) {
    const { email, phone } = context.propsValue;
    if (!email && !phone) {
      throw new Error('Give an email or a phone number to search by.');
    }
    const res = await trulataRequest<{ leads: unknown[] }>(
      context.auth.secret_text,
      HttpMethod.GET,
      '/leads/search',
      undefined,
      { email: email ?? '', phone: phone ?? '' }
    );
    return res.leads;
  },
});
