import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioClient } from '../../../common/client';
import { podioGetEmailContactForReferenceAsVcardOutputSchema } from '../../../output-schemas';

export const getGlobalEmailContactAsVcardAction = createAction({
  auth: podioAuth,
  name: 'podio_get_global_email_contact_as_vcard',
  outputSchema: podioGetEmailContactForReferenceAsVcardOutputSchema,
  displayName: 'Get Global Email Contact as vCard',
  description: 'Gets the personal task email-in address as a vCard.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Reads the connected user\'s personal Podio task email-in address as vCard text, for import into an address book. Use Get Global Email Contact for structured data.',
    idempotent: true,
  },
  props: {},
  async run({ auth }) {
    return { vcard: await podioClient.request<string>({ auth, method: HttpMethod.GET, path: '/email/contact/task/vcard' }) };
  },
});
