import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { shortIoAiLinkFields } from '../../common/ai-link-fields';
import { shortIoAiProps } from '../../common/ai-props';
import { shortIoAuth } from '../../common/auth';
import { shortIoClient } from '../../common/client';
import { shortIoLinks } from '../../common/links';
import { shortIoSchemas } from '../../common/output-schemas';
import { shortIoTargeting } from '../../common/targeting';

export const updateLinkAiAction = createAction({
  auth: shortIoAuth,
  name: 'update_link',
  displayName: 'Update Short Link (AI)',
  description: 'Change the settings of a short link by link ID; only the fields you give are changed.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Updates an existing short link by link ID: destination URL, slug, title, tags (replaces the list), folder, UTM fields, expiry or scheduled deletion. Only fields you provide change. Idempotent: sending the same values again leaves the link the same.',
    idempotent: true,
  },
  outputSchema: shortIoSchemas.link,
  props: {
    linkId: shortIoAiProps.linkId(),
    originalURL: Property.ShortText({ displayName: 'Original URL', description: 'New destination URL.', required: false }),
    ...shortIoAiLinkFields.linkSettingProps,
  },
  async run({ auth, propsValue }) {
    if (propsValue.originalURL?.trim()) {
      shortIoTargeting.httpUrl({ value: propsValue.originalURL, label: 'Original URL' });
    }
    const body = shortIoAiLinkFields.aiLinkBody({ values: { ...propsValue }, now: Date.now() });
    if (Object.keys(body).length === 0) {
      throw new Error('Nothing to update: give at least one field to change.');
    }
    const linkId = shortIoClient.seg({ value: propsValue.linkId, label: 'Link ID' });
    try {
      const response = await shortIoClient.request({ auth, method: HttpMethod.POST, path: `/links/${linkId}`, body });
      return shortIoLinks.scrubLink(response);
    } catch (error) {
      return shortIoClient.rethrowWithHint({
        error,
        hints: {
          404: 'Short link not found. Check the link ID.',
          409: 'Another link on this domain already uses this path.',
          400: 'Short.io rejected the link settings.',
        },
      });
    }
  },
});
