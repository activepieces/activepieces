import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { bitlyApiCall, requireGuid } from '../common/client';
import { bitlyAuth } from '../common/auth';
import { groupGuid, domain, optionalText, toStringList } from '../common/props';
import { bitlinkOutputSchema } from '../common/schemas';

export const createBitlinkAction = createAction({
  auth: bitlyAuth,
  name: 'create_bitlink',
  classification: 'WRITE',
  displayName: 'Create Bitlink',
  description: 'Shorten a long URL with optional customization.',
  audience: 'human',
  outputSchema: bitlinkOutputSchema,
  aiMetadata: { description: 'Shortens a long URL into a Bitlink, optionally setting title, tags, custom branded domain, and mobile app deeplinks. Use to create a trackable short link from a destination URL (must start with http:// or https://). Not idempotent: each call creates a link, though Bitly may return an existing Bitlink for the same URL unless Force New Link is enabled.', idempotent: false },
  props: {
    long_url: Property.ShortText({
      displayName: 'Long URL',
      description: 'The URL to shorten (must include http:// or https://).',
      required: true,
    }),
    group_guid: groupGuid,
    domain: {
      ...domain,
      defaultValue: 'bit.ly',
    },
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Custom title for the Bitlink.',
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Tags to apply to the Bitlink.',
      required: false,
    }),
    force_new_link: Property.Checkbox({
      displayName: 'Force New Link',
      description: 'Create new link even if one exists for this URL.',
      required: false,
      defaultValue: false,
    }),
    app_id: Property.ShortText({
      displayName: 'Mobile App ID',
      description: 'Mobile app identifier (e.g., com.yourapp.name).',
      required: false,
    }),
    app_uri_path: Property.ShortText({
      displayName: 'App URI Path',
      description: 'Path within the mobile app (e.g., /product/123).',
      required: false,
    }),
    install_url: Property.LongText({
      displayName: 'App Install URL',
      description: 'URL where users can install the mobile app.',
      required: false,
    }),
    install_type: Property.StaticDropdown({
      displayName: 'Install Type',
      description: 'How to handle app installation.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'No Install', value: 'no_install' },
          { label: 'Auto Install', value: 'auto_install' },
          { label: 'Promote Install', value: 'promote_install' },
        ],
      },
    }),
  },
  async run(context) {
    const { long_url, group_guid, domain, title, tags, force_new_link } = context.propsValue;
    const deeplinkValues = {
      app_id: optionalText(context.propsValue.app_id),
      app_uri_path: optionalText(context.propsValue.app_uri_path),
      install_url: optionalText(context.propsValue.install_url),
      install_type: optionalText(context.propsValue.install_type),
    };
    const filled = Object.values(deeplinkValues).filter((v) => v !== undefined).length;
    if (filled > 0 && filled < 4) {
      throw new Error('To add a mobile deeplink, fill Mobile App ID, App URI Path, App Install URL and Install Type together.');
    }
    return bitlyApiCall({
      method: HttpMethod.POST,
      auth: context.auth.props,
      resourceUri: '/bitlinks',
      body: buildShortenBody({
        longUrl: long_url,
        groupGuid: group_guid,
        domain,
        title,
        tags,
        forceNewLink: force_new_link === true,
        deeplinks: filled === 4 ? [deeplinkValues] : undefined,
      }),
      operation: 'create Bitlink',
    });
  },
});

export function buildShortenBody({
  longUrl,
  groupGuid,
  domain,
  title,
  tags,
  forceNewLink,
  deeplinks,
}: {
  longUrl: unknown;
  groupGuid: unknown;
  domain: unknown;
  title: unknown;
  tags: unknown;
  forceNewLink: boolean;
  deeplinks: Record<string, string | undefined>[] | undefined;
}): Record<string, unknown> {
  const url = optionalText(longUrl);
  if (!url || !/^https?:\/\//i.test(url)) {
    throw new Error("Invalid Long URL. It must start with 'http://' or 'https://'.");
  }
  const guid = optionalText(groupGuid);
  const tagList = toStringList(tags);
  return {
    long_url: url,
    ...(guid ? { group_guid: requireGuid({ value: guid, label: 'Group GUID' }) } : {}),
    ...(optionalText(domain) ? { domain: optionalText(domain) } : {}),
    ...(optionalText(title) ? { title: optionalText(title) } : {}),
    ...(tagList && tagList.length > 0 ? { tags: tagList } : {}),
    ...(forceNewLink ? { force_new_link: true } : {}),
    ...(deeplinks ? { deeplinks } : {}),
  };
}
