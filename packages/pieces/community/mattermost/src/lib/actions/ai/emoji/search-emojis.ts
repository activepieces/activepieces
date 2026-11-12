import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostUtils } from '../../../common/utils';
import { mattermostGetEmojisByNamesOutputSchema } from '../../../output-schemas';

export const searchEmojisAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_search_emojis',
  outputSchema: mattermostGetEmojisByNamesOutputSchema,
  displayName: 'Search Custom Emojis',
  description: 'Searches custom emoji by name.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Finds custom emoji whose name contains the term (or starts with it, with Prefix Only set to "true"); returns at most 200. Built-in emoji are not included.',
    idempotent: true,
  },
  props: {
    term: Property.ShortText({
      displayName: 'Term',
      description: 'Text to match against emoji names.',
      required: true,
    }),
    prefixOnly: mattermostAiProps.booleanFlag({
      required: false,
      displayName: 'Prefix Only',
      description: '"true" to match only names starting with the term. Defaults to "false".',
    }),
  },
  async run(context) {
    const { term, prefixOnly } = context.propsValue;
    const emojis = await mattermostClient.request<unknown[]>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/emoji/search',
      body: { term, prefix_only: mattermostUtils.parseBoolean({ value: prefixOnly }) },
    });
    return { emojis, count: emojis.length };
  },
});
