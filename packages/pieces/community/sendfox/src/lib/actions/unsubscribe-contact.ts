import { createAction, Property } from '@activepieces/pieces-framework';
import { sendfoxAuth } from '../auth';
import { callsendfoxApi } from '../../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const unsubscribe = createAction({
  name: 'unsubscribe',
  auth: sendfoxAuth,
  displayName: 'Unsubscribe Contact',
  description: 'Unsubscribe a contact',
  audience: 'both',
  aiMetadata: { description: 'Unsubscribes a contact from SendFox by email so they stop receiving emails. Use to honor an opt-out or remove someone from sends. Effectively idempotent in outcome (the contact ends up unsubscribed), but flagged not idempotent because each call issues a state-changing request.', idempotent: false },
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      required: true,
    }),
  },
  async run(context) {
    const authentication = context.auth;
    const accessToken = authentication.secret_text;
    const email = context.propsValue.email;
    const response = (
      await callsendfoxApi(HttpMethod.PATCH, 'unsubscribe', accessToken, {
        email: email,
      })
    ).body;
    return [response];
  },
});
