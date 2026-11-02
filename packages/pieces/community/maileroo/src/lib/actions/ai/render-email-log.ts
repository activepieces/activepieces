import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { mailerooAuth } from '../../auth';
import { mailerooClient } from '../../common/client';
import { mailerooRenderEmailLogOutputSchema } from '../../output-schemas';

export const mailerooRenderEmailLog = createAction({
  auth: mailerooAuth,
  name: 'maileroo_render_email_log',
  outputSchema: mailerooRenderEmailLogOutputSchema,
  displayName: 'Render Email Log',
  description: 'Gets a viewable URL for a stored email.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Returns a URL that shows the rendered stored email in a browser. Get the message ID from maileroo_search_email_logs. Requires an Account Key connection.',
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
      path: `/logs/email/${encodeURIComponent(message_id)}/render`,
    });
  },
});
