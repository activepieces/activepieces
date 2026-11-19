import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { bitlyAuth } from '../../common/auth';
import { bitlyApiCall, resolveGroupGuid } from '../../common/client';
import { optionalText, toStringList } from '../../common/props';
import { bitlinkListOutputSchema, BitlyLink, BitlyPagination } from '../../common/schemas';

export const aiSearchBitlinksAction = createAction({
  auth: bitlyAuth,
  name: 'ai_search_bitlinks',
  classification: 'SEARCH',
  displayName: 'Search Bitlinks',
  description: 'Search the Bitlinks of a group, newest first, one page at a time.',
  audience: 'ai',
  aiMetadata: {
    description: 'Searches Bitlinks in a group, newest first, by free text (title, URL), tags and archive status. Returns up to Page Size links plus next_cursor; pass next_cursor as Cursor for the next page (empty means no more). Each link id (e.g. bit.ly/abc123) is the Bitlink ID for the other tools. Read-only.',
    idempotent: true,
  },
  outputSchema: bitlinkListOutputSchema,
  props: {
    group_guid: Property.ShortText({
      displayName: 'Group GUID',
      description: 'From List Groups. Leave empty to use the account default group.',
      required: false,
    }),
    query: Property.ShortText({
      displayName: 'Search Text',
      description: 'Matches the title, long URL or Bitlink.',
      required: false,
    }),
    tags: Property.ShortText({
      displayName: 'Tags',
      description: 'Comma-separated tags; links must carry the tags.',
      required: false,
    }),
    archived: Property.StaticDropdown<string>({
      displayName: 'Archived',
      description: 'off = active only (default), on = archived only, both = all.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Active only', value: 'off' },
          { label: 'Archived only', value: 'on' },
          { label: 'Both', value: 'both' },
        ],
      },
    }),
    size: Property.Number({
      displayName: 'Page Size',
      description: '1 to 100. Defaults to 50.',
      required: false,
    }),
    cursor: Property.ShortText({
      displayName: 'Cursor',
      description: 'next_cursor from the previous page.',
      required: false,
    }),
  },
  async run(context) {
    const { propsValue } = context;
    const archived = optionalText(propsValue.archived) ?? 'off';
    if (!['off', 'on', 'both'].includes(archived)) {
      throw new Error('Archived must be off, on or both.');
    }
    const size = propsValue.size === undefined || propsValue.size === null ? 50 : Number(propsValue.size);
    if (!Number.isInteger(size) || size < 1 || size > 100) {
      throw new Error('Page Size must be a whole number from 1 to 100.');
    }
    const guid = await resolveGroupGuid({ auth: context.auth.props, groupGuid: propsValue.group_guid });
    const response = await bitlyApiCall<{ links?: BitlyLink[]; pagination?: BitlyPagination }>({
      method: HttpMethod.GET,
      auth: context.auth.props,
      resourceUri: `/groups/${guid}/bitlinks`,
      query: {
        size,
        archived,
        query: optionalText(propsValue.query),
        tags: toStringList(propsValue.tags),
        search_after: optionalText(propsValue.cursor),
      },
      operation: 'search Bitlinks',
    });
    return {
      links: response.links ?? [],
      next_cursor: response.pagination?.search_after || null,
    };
  },
});
