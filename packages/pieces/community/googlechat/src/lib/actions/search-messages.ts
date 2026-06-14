import { createAction, Property } from '@activepieces/pieces-framework';
import { propsValidation } from '@activepieces/pieces-common';
import { googleChatApiAuth, googleChatCommon } from '../common';
import { allSpacesDropdown } from '../common/props';
import { googleChatAPIService } from '../common/requests';

export const searchMessages = createAction({
  auth: googleChatApiAuth,
  name: 'searchMessages',
  displayName: 'Search Messages',
  description: 'Search within Chat for messages matching keywords or filters.',
  audience: 'both',
  aiMetadata: {
    description: 'Lists recent messages in a given Google Chat space and returns those whose text contains the supplied keyword (case-insensitive substring match), capped by an optional result limit. Use to find messages mentioning a term within one space; note it scans only the latest messages fetched, not the full space history. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    spaceId: allSpacesDropdown({ refreshers: ['auth'], required: true }),
    keyword: Property.ShortText({
      displayName: 'Keyword',
      description: 'Search for messages containing this text',
      required: true,
    }),
    limit: Property.Number({
      displayName: 'Max Results',
      description: 'Maximum number of messages to return',
      required: false,
      defaultValue: 50,
    }),
  },
  async run({ auth, propsValue }) {
    await propsValidation.validateZod(propsValue, googleChatCommon.searchMessagesSchema);

    const { spaceId, keyword, limit } = propsValue;

    const response = await googleChatAPIService.listMessages(
      auth.access_token,
      spaceId as string,
      limit
    );

    const messages = response.messages || [];

    const filtered = messages.filter((msg: any) =>
      msg.text?.toLowerCase().includes(keyword.toLowerCase())
    );

    return filtered;
  },
});
