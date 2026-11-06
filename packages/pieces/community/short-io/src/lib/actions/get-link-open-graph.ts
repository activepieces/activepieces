import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { shortIoAiProps } from '../common/ai-props';
import { shortIoAuth } from '../common/auth';
import { shortIoClient } from '../common/client';
import { shortIoLinks } from '../common/links';
import { shortIoSchemas } from '../common/output-schemas';

function toPairs(response: unknown): { property: string; value: string }[] {
  if (!Array.isArray(response)) {
    return [];
  }
  return response.flatMap((pair) =>
    Array.isArray(pair) && typeof pair[0] === 'string' && pair[1] !== undefined && pair[1] !== null ? [{ property: pair[0], value: String(pair[1]) }] : [],
  );
}

export const getLinkOpenGraphAction = createAction({
  auth: shortIoAuth,
  name: 'get_link_open_graph',
  displayName: 'Get Link Social Preview (OpenGraph)',
  description: 'Get the custom social-preview (OpenGraph) title, description and image set on a short link.',
  audience: 'both',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns the custom OpenGraph properties (og title, description, image, twitter card…) set on a short link, i.e. what social networks show when the link is shared. Use to check or report a link’s social preview. Empty when none are set (custom OpenGraph needs a Short.io Pro plan). Read-only.',
    idempotent: true,
  },
  outputSchema: shortIoSchemas.openGraph,
  props: {
    domain: shortIoAiProps.domain(),
    linkId: shortIoAiProps.linkId(),
  },
  async run({ auth, propsValue }) {
    const linkSeg = shortIoClient.seg({ value: propsValue.linkId, label: 'Link ID' });
    const domain = await shortIoLinks.resolveDomain({ auth, input: propsValue.domain });
    try {
      const response = await shortIoClient.request({
        auth,
        method: HttpMethod.GET,
        path: `/links/opengraph/${shortIoClient.domainIdSeg(domain.id)}/${linkSeg}`,
      });
      const items = toPairs(response);
      return {
        linkId: propsValue.linkId.trim(),
        properties: Object.fromEntries(items.map((item) => [item.property, item.value])),
        items,
        count: items.length,
      };
    } catch (error) {
      return shortIoClient.rethrowWithHint({ error, hints: { 404: 'Short link not found on this domain. Check the link ID and domain.' } });
    }
  },
});
