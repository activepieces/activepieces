import { createAction, MarkdownVariant, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sendfoxAuth } from '../auth';
import { sendfoxClient } from '../common/client';
import { unsubscribeContactOutputSchema } from '../output-schemas';

export const unsubscribeContactAction = createAction({
  name: 'unsubscribe',
  classification: 'DESTRUCTIVE',
  auth: sendfoxAuth,
  displayName: 'Unsubscribe Contact',
  description: 'Stop all SendFox emails to a contact',
  audience: 'both',
  aiMetadata: { description: 'Unsubscribes a contact from SendFox by email so they stop receiving emails. Use to honor an opt-out or remove someone from sends. Effectively idempotent in outcome (the contact ends up unsubscribed), but flagged not idempotent because each call issues a state-changing request.', idempotent: false },
  outputSchema: unsubscribeContactOutputSchema,
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
    const response = await sendfoxClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.PATCH,
      path: '/unsubscribe',
      body: { email: context.propsValue.email },
    });
    return [response];
  },
});
