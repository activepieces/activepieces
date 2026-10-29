import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { shortIoAuth } from '../common/auth';
import { shortIoClient } from '../common/client';
import { shortIoSchemas } from '../common/output-schemas';
import { shortIoValues } from '../common/values';

const LINK_ID_PATTERN = /^(lnk|link)_[^/\s]+$/;

export const addTagToLinksAction = createAction({
  auth: shortIoAuth,
  name: 'add_tag_to_links',
  displayName: 'Add Tag to Links',
  description: 'Append one tag to one or more short links.',
  audience: 'both',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Appends a single tag to one or more short links given their link IDs; existing tags are kept. Idempotent: tagging a link that already has the tag changes nothing.',
    idempotent: true,
  },
  outputSchema: shortIoSchemas.tagLinks,
  props: {
    tag: Property.ShortText({
      displayName: 'Tag',
      description: 'The tag to add.',
      required: true,
    }),
    linkIds: Property.Array({
      displayName: 'Link IDs',
      description: 'Link IDs to tag (the idString of each link, e.g. link_8yXK_034ebx7JWAtAAK3vFcl6ye).',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const tag = propsValue.tag.trim();
    if (!tag) {
      throw new Error('Tag is required.');
    }
    const linkIds = [...new Set(shortIoValues.stringList(propsValue.linkIds))];
    if (linkIds.length === 0) {
      throw new Error('At least one Link ID is required.');
    }
    const invalid = linkIds.filter((id) => !LINK_ID_PATTERN.test(id));
    if (invalid.length > 0) {
      throw new Error(`These are not Short.io link IDs (expected link_… or lnk_…): ${invalid.slice(0, 5).join(', ')}`);
    }
    try {
      await shortIoClient.request({ auth, method: HttpMethod.POST, path: '/tags/bulk', body: { tag, link_ids: linkIds } });
      return { tag, linkIds, count: linkIds.length };
    } catch (error) {
      return shortIoClient.rethrowWithHint({ error, hints: { 400: 'Short.io rejected the tag request.' } });
    }
  },
});
