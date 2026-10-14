import { createAction } from '@activepieces/pieces-framework';
import { shortIoAuth } from '../common/auth';
import { shortIoLinks } from '../common/links';
import { shortIoSchemas } from '../common/output-schemas';

export const listDomainsAction = createAction({
  auth: shortIoAuth,
  name: 'list_domains',
  displayName: 'List Domains',
  description: 'List every domain on the Short.io account.',
  audience: 'both',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists all branded domains on the connected Short.io account with their numeric ID and hostname. Use first to learn which domain to pass to other Short.io steps. Read-only.',
    idempotent: true,
  },
  outputSchema: shortIoSchemas.domainList,
  props: {},
  async run({ auth }) {
    const domains = await shortIoLinks.listAllDomains(auth);
    const items = domains.map(shortIoLinks.pickDomain);
    return { items, count: items.length };
  },
});
