import { createAction, MarkdownVariant, Property } from '@activepieces/pieces-framework';
import { sendfoxAuth } from '../auth';
import { callsendfoxApi } from '../../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const unsubscribe = createAction({
  name: 'unsubscribe',
  classification: 'DESTRUCTIVE',
  auth: sendfoxAuth,
  displayName: 'Unsubscribe Contact',
  description: 'Stop all SendFox emails to a contact',
  audience: 'both',
  aiMetadata: { description: 'Unsubscribes a contact from SendFox by email so they stop receiving emails. Use to honor an opt-out or remove someone from sends. Effectively idempotent in outcome (the contact ends up unsubscribed), but flagged not idempotent because each call issues a state-changing request.', idempotent: false },
  props: {
    info: Property.MarkDown({
      value:
        'Stops **all** SendFox emails to this address, on every list. SendFox has no way to undo this through the API.',
      variant: MarkdownVariant.WARNING,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      required: true,
      placeholder: 'jane@example.com',
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
