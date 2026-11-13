import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostClient } from '../../../common/client';
import { mattermostGetEmojisByNamesOutputSchema } from '../../../output-schemas';

export const getEmojisByNamesAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_get_emojis_by_names',
  outputSchema: mattermostGetEmojisByNamesOutputSchema,
  displayName: 'Get Custom Emojis By Names',
  description: 'Gets several custom emoji by their names.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns the custom emoji matching the given exact names (up to 200); names that match no custom emoji are left out. Needs server 9.2 or later.',
    idempotent: true,
  },
  props: {
    names: Property.Array({
      displayName: 'Emoji Names',
      description: 'Exact custom emoji names without colons, e.g. ["party_parrot"].',
      required: true,
    }),
  },
  async run(context) {
    const emojis = await mattermostClient.request<unknown[]>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/emoji/names',
      body: context.propsValue.names,
    });
    return { emojis, count: emojis.length };
  },
});
