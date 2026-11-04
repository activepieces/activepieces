import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioGetEmailContactForReferenceAsVcardOutputSchema } from '../../../output-schemas';

export const getVcardAction = createAction({
  auth: podioAuth,
  name: 'podio_get_vcard',
  outputSchema: podioGetEmailContactForReferenceAsVcardOutputSchema,
  displayName: 'Get vCard',
  description: 'Gets one contact as a vCard.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Reads one Podio contact as vCard text, for import into an address book. Use Get Contacts By ID for the contact as structured data. The profile id comes from List Contacts or Get Space Contacts.',
    idempotent: true,
  },
  props: {
    profileId: podioAiProps.id({ required: true, displayName: 'Profile ID', description: 'The profile id of the contact, from List Contacts or Get Space Contacts.' }),
  },
  async run({ auth, propsValue }) {
    return { vcard: await podioClient.request<string>({ auth, method: HttpMethod.GET, path: `/contact/${propsValue.profileId}/vcard` }) };
  },
});
