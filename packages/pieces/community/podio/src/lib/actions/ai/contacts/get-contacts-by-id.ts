import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioGetContactsByIdOutputSchema } from '../../../output-schemas';

export const getContactsByIdAction = createAction({
  auth: podioAuth,
  name: 'podio_get_contacts_by_id',
  outputSchema: podioGetContactsByIdOutputSchema,
  displayName: 'Get Contacts By ID',
  description: 'Gets the full details of one or more contacts by profile id.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Reads the full details of one or more Podio contacts (user or space) by profile id. Profile ids come from List Contacts, Get Space Contacts, or Get Organization Contacts.',
    idempotent: true,
  },
  props: {
    profileIds: podioAiProps.idList({ required: true, displayName: 'Profile IDs', description: 'The profile ids of the contacts, from List Contacts or Get Space Contacts.' }),
    spaceId: podioAiProps.id({ required: false, displayName: 'Space ID', description: 'When set, the role and removable flags are given in the context of this workspace.' }),
  },
  async run({ auth, propsValue }) {
    if (propsValue.profileIds.length === 0) {
      throw new Error('profileIds must contain at least one profile id.');
    }
    const body = await podioClient.request<unknown>({
      auth,
      method: HttpMethod.GET,
      path: `/contact/${propsValue.profileIds.join(',')}/v2`,
      query: podioUtils.query({ values: { space_id: propsValue.spaceId } }),
    });
    const contacts = Array.isArray(body) ? body : [body];
    return { contacts, count: contacts.length };
  },
});
