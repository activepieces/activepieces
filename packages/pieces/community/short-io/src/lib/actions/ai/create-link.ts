import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { shortIoAiLinkFields } from '../../common/ai-link-fields';
import { shortIoAiProps } from '../../common/ai-props';
import { shortIoAuth } from '../../common/auth';
import { shortIoClient } from '../../common/client';
import { shortIoLinks } from '../../common/links';
import { shortIoSchemas } from '../../common/output-schemas';
import { shortIoTargeting } from '../../common/targeting';

export const createLinkAiAction = createAction({
  auth: shortIoAuth,
  name: 'create_link',
  displayName: 'Create Short Link (AI)',
  description: 'Create a short link on a domain given by hostname or ID.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates a short link on a Short.io domain for a long URL, optionally with a custom slug, title, tags, UTM parameters, expiry date or scheduled deletion. Not idempotent: a repeat call with no slug creates another link; with the same slug it fails unless the URL matches.',
    idempotent: false,
  },
  outputSchema: shortIoSchemas.link,
  props: {
    domain: shortIoAiProps.domain(),
    originalURL: Property.ShortText({ displayName: 'Original URL', description: 'The long URL the short link redirects to.', required: true }),
    ...shortIoAiLinkFields.linkSettingProps,
  },
  async run({ auth, propsValue }) {
    const originalURL = shortIoTargeting.httpUrl({ value: propsValue.originalURL, label: 'Original URL' });
    const body = shortIoAiLinkFields.aiLinkBody({ values: { ...propsValue }, now: Date.now() });
    const domain = await shortIoLinks.resolveDomain({ auth, input: propsValue.domain });
    try {
      const response = await shortIoClient.request({
        auth,
        method: HttpMethod.POST,
        path: '/links',
        body: { ...body, originalURL, domain: domain.hostname },
      });
      return shortIoLinks.scrubLink(response);
    } catch (error) {
      return shortIoClient.rethrowWithHint({
        error,
        hints: {
          409: 'A link with this path already exists on the domain and points to a different URL.',
          400: 'Short.io rejected the link settings.',
        },
      });
    }
  },
});
