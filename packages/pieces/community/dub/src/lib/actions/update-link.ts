import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { dubAuth, DUB_API_BASE } from '../auth';
import { DubLink } from '../common/common';

export const updateLink = createAction({
  name: 'update_link',
  displayName: 'Update Link',
  description: 'Update an existing Dub link. Only the fields you fill in will be updated.',
  auth: dubAuth,
  props: {
    linkId: Property.ShortText({
      displayName: 'Link ID',
      description: 'The ID of the link to update (e.g. `clv3g2...`). Find this from the Create Link or List Links actions.',
      required: true,
    }),
    url: Property.ShortText({
      displayName: 'New Destination URL',
      description: 'Update the destination URL the link redirects to.',
      required: false,
    }),
    key: Property.ShortText({
      displayName: 'New Slug',
      description: 'Update the short link slug (the part after the domain).',
      required: false,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Update the human-readable title.',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Update the link description.',
      required: false,
    }),
    image: Property.ShortText({
      displayName: 'OG Image URL',
      description: 'Update the custom link preview image (og:image).',
      required: false,
    }),
    video: Property.ShortText({
      displayName: 'OG Video URL',
      description: 'Update the custom link preview video (og:video).',
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Tag Names',
      description: 'Replace the link\'s tags with this new list of tag names. Send an empty array to clear all tags.',
      required: false,
    }),
    folderId: Property.ShortText({
      displayName: 'Folder ID',
      description: 'Move this link to a different folder by its ID.',
      required: false,
    }),
    expiresAt: Property.ShortText({
      displayName: 'Expires At',
      description: 'ISO 8601 datetime when the link should expire. Set to empty to remove expiration.',
      required: false,
    }),
    expiredUrl: Property.ShortText({
      displayName: 'Expired URL',
      description: 'URL to redirect to after expiration.',
      required: false,
    }),
    password: Property.ShortText({
      displayName: 'Password',
      description: 'Update the password for this link. Leave blank to remove password protection.',
      required: false,
    }),
    trackConversion: Property.Checkbox({
      displayName: 'Track Conversions',
      description: 'Whether to track conversions for this link.',
      required: false,
    }),
    proxy: Property.Checkbox({
      displayName: 'Custom Link Previews',
      description: 'Enable or disable Custom Link Previews (og:title, og:description, og:image) for this link.',
      required: false,
    }),
    rewrite: Property.Checkbox({
      displayName: 'Cloaked URL (URL Rewriting)',
      description: 'Toggle URL cloaking.',
      required: false,
    }),
    doIndex: Property.Checkbox({
      displayName: 'Allow Search Engine Indexing',
      description: 'Allow search engines to index this short link.',
      required: false,
    }),
    archived: Property.Checkbox({
      displayName: 'Archived',
      description: 'Archive or unarchive the link.',
      required: false,
    }),
    ios: Property.ShortText({
      displayName: 'iOS Redirect URL',
      description: 'Update the iOS-specific redirect URL.',
      required: false,
    }),
    android: Property.ShortText({
      displayName: 'Android Redirect URL',
      description: 'Update the Android-specific redirect URL.',
      required: false,
    }),
    comments: Property.LongText({
      displayName: 'Comments',
      description: 'Update internal notes for this link.',
      required: false,
    }),
    utm_source: Property.ShortText({
      displayName: 'UTM Source',
      description: 'Update the UTM source parameter.',
      required: false,
    }),
    utm_medium: Property.ShortText({
      displayName: 'UTM Medium',
      description: 'Update the UTM medium parameter.',
      required: false,
    }),
    utm_campaign: Property.ShortText({
      displayName: 'UTM Campaign',
      description: 'Update the UTM campaign parameter.',
      required: false,
    }),
    utm_term: Property.ShortText({
      displayName: 'UTM Term',
      description: 'Update the UTM term parameter.',
      required: false,
    }),
    utm_content: Property.ShortText({
      displayName: 'UTM Content',
      description: 'Update the UTM content parameter.',
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const { linkId, ...rest } = propsValue;

    const body: Record<string, unknown> = {};

    if (rest.url !== undefined && rest.url !== null && rest.url !== '') body['url'] = rest.url;
    if (rest.key !== undefined && rest.key !== null && rest.key !== '') body['key'] = rest.key;
    if (rest.title !== undefined && rest.title !== null) body['title'] = rest.title;
    if (rest.description !== undefined && rest.description !== null) body['description'] = rest.description;
    if (rest.image !== undefined && rest.image !== null) body['image'] = rest.image;
    if (rest.video !== undefined && rest.video !== null) body['video'] = rest.video;
    if (rest.tags !== undefined) body['tagNames'] = rest.tags;
    if (rest.folderId !== undefined && rest.folderId !== null) body['folderId'] = rest.folderId;
    if (rest.expiresAt !== undefined && rest.expiresAt !== null) body['expiresAt'] = rest.expiresAt;
    if (rest.expiredUrl !== undefined && rest.expiredUrl !== null) body['expiredUrl'] = rest.expiredUrl;
    if (rest.password !== undefined && rest.password !== null) body['password'] = rest.password;
    if (rest.trackConversion !== undefined) body['trackConversion'] = rest.trackConversion;
    if (rest.proxy !== undefined) body['proxy'] = rest.proxy;
    if (rest.rewrite !== undefined) body['rewrite'] = rest.rewrite;
    if (rest.doIndex !== undefined) body['doIndex'] = rest.doIndex;
    if (rest.archived !== undefined) body['archived'] = rest.archived;
    if (rest.ios !== undefined && rest.ios !== null) body['ios'] = rest.ios;
    if (rest.android !== undefined && rest.android !== null) body['android'] = rest.android;
    if (rest.comments !== undefined && rest.comments !== null) body['comments'] = rest.comments;
    if (rest.utm_source !== undefined && rest.utm_source !== null) body['utm_source'] = rest.utm_source;
    if (rest.utm_medium !== undefined && rest.utm_medium !== null) body['utm_medium'] = rest.utm_medium;
    if (rest.utm_campaign !== undefined && rest.utm_campaign !== null) body['utm_campaign'] = rest.utm_campaign;
    if (rest.utm_term !== undefined && rest.utm_term !== null) body['utm_term'] = rest.utm_term;
    if (rest.utm_content !== undefined && rest.utm_content !== null) body['utm_content'] = rest.utm_content;

    if (Object.keys(body).length === 0) {
      throw new Error('At least one field must be provided to update.');
    }

    const response = await httpClient.sendRequest<DubLink>({
      method: HttpMethod.PATCH,
      url: `${DUB_API_BASE}/links/${linkId}`,
      headers: {
        Authorization: `Bearer ${auth.secret_text}`,
        'Content-Type': 'application/json',
      },
      body,
    });

    return response.body;
  },
});
