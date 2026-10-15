import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { shortIoAiProps } from '../common/ai-props';
import { shortIoAuth } from '../common/auth';
import { shortIoClient } from '../common/client';
import { shortIoLinks } from '../common/links';
import { shortIoSchemas } from '../common/output-schemas';

export const getDomainAction = createAction({
  auth: shortIoAuth,
  name: 'get_domain',
  displayName: 'Get Domain',
  description: 'Get the settings of one Short.io domain.',
  audience: 'both',
  classification: 'READ',
  aiMetadata: {
    description: 'Returns the details of one Short.io domain (ID, hostname, state, link type, redirects) given its hostname or numeric ID. Read-only.',
    idempotent: true,
  },
  outputSchema: shortIoSchemas.domain,
  props: {
    domain: shortIoAiProps.domain(),
  },
  async run({ auth, propsValue }) {
    const domain = await shortIoLinks.resolveDomain({ auth, input: propsValue.domain });
    try {
      const response = await shortIoClient.request({
        auth,
        method: HttpMethod.GET,
        path: `/domains/${shortIoClient.domainIdSeg(domain.id)}`,
      });
      return shortIoLinks.pickDomain(shortIoLinks.isRecord(response) ? response : {});
    } catch (error) {
      return shortIoClient.rethrowWithHint({ error, hints: { 404: 'Domain not found.' } });
    }
  },
});
