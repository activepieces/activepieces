import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostUtils } from '../../../common/utils';
import { mattermostGetEmojisByNamesOutputSchema } from '../../../output-schemas';

export const listEmojisAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_list_emojis',
  outputSchema: mattermostGetEmojisByNamesOutputSchema,
  displayName: 'List Custom Emojis',
  description: 'Lists the server\'s custom emoji.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Returns a page of the server\'s custom emoji (ID, name, creator); built-in emoji are not included. Use Search Custom Emojis to find one by name fragment.',
    idempotent: true,
  },
  props: {
    sort: Property.StaticDropdown({
      displayName: 'Sort',
      description: '"name" to sort by emoji name. Defaults to no sorting.',
      required: false,
      options: {
        disabled: false,
        options: [{ label: 'Name', value: 'name' }],
      },
    }),
    page: mattermostAiProps.page({ required: false }),
    perPage: mattermostAiProps.perPage({ required: false }),
  },
  async run(context) {
    const { sort, page, perPage } = context.propsValue;
    const emojis = await mattermostClient.request<unknown[]>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: '/emoji',
      query: {
        ...mattermostUtils.paging({ page, perPage }),
        ...(sort ? { sort } : {}),
      },
    });
    return { emojis, count: emojis.length };
  },
});
