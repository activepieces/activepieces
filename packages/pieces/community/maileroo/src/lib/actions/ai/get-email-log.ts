import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { mailerooAuth } from '../../auth';
import { mailerooClient } from '../../common/client';
import { mailerooGetEmailLogOutputSchema } from '../../output-schemas';

export const mailerooGetEmailLog = createAction({
  auth: mailerooAuth,
  name: 'maileroo_get_email_log',
  outputSchema: mailerooGetEmailLogOutputSchema,
  displayName: 'Get Email Log',
  description: 'Gets the stored raw message for a message ID.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Returns the sender, recipients, collection time and the raw RFC822 source of a stored email. Get the message ID from maileroo_search_email_logs; use maileroo_render_email_log for a browser-viewable URL instead. Requires an Account Key connection.',
    idempotent: true,
  },
  props: {
    message_id: Property.ShortText({
      displayName: 'Message ID',
      description: 'Message ID from maileroo_search_email_logs.',
      required: true,
    }),
  },
  async run(context) {
    const { message_id } = context.propsValue;
    return await mailerooClient.accountRequest({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/logs/email/${encodeURIComponent(message_id)}`,
    });
  },
});
