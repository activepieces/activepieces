import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { bitlyAuth } from '../../common/auth';
import { bitlyApiCall } from '../../common/client';
import { bitlinkOutputSchema } from '../../common/schemas';
import { buildShortenBody } from '../create-bitlink';

export const aiShortenUrlAction = createAction({
  auth: bitlyAuth,
  name: 'ai_shorten_url',
  classification: 'WRITE',
  displayName: 'Shorten URL',
  description: 'Create a Bitlink for a long URL.',
  audience: 'ai',
  aiMetadata: {
    description: 'Shortens a long URL (must start with http:// or https://) into a Bitlink, with optional title, tags, group and domain. Returns the Bitlink; its id (e.g. bit.ly/abc123) is the Bitlink ID for other tools. Bitly may return the existing Bitlink for a URL already shortened in the group, but a repeat call can still create a new link and uses the monthly link quota, so do not retry blindly.',
    idempotent: false,
  },
  outputSchema: bitlinkOutputSchema,
  props: {
    long_url: Property.ShortText({ displayName: 'Long URL', description: 'Starts with http:// or https://.', required: true }),
    title: Property.ShortText({ displayName: 'Title', required: false }),
    tags: Property.ShortText({ displayName: 'Tags', description: 'Comma-separated tags.', required: false }),
    group_guid: Property.ShortText({ displayName: 'Group GUID', description: 'From List Groups. Leave empty for the account default group.', required: false }),
    domain: Property.ShortText({ displayName: 'Domain', description: 'bit.ly (default) or a branded domain from List Groups.', required: false }),
  },
  async run(context) {
    const { propsValue } = context;
    return bitlyApiCall({
      method: HttpMethod.POST,
      auth: context.auth.props,
      resourceUri: '/bitlinks',
      body: buildShortenBody({
        longUrl: propsValue.long_url,
        groupGuid: propsValue.group_guid,
        domain: propsValue.domain,
        title: propsValue.title,
        tags: propsValue.tags,
        forceNewLink: false,
        deeplinks: undefined,
      }),
      operation: 'shorten URL',
    });
  },
});
