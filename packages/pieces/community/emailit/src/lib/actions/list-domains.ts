import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { emailitAuth } from '../auth';
import { emailitClient } from '../common/client';
import { emailitSchemas } from '../common/output-schemas';
import { emailitProps } from '../common/props';
import { emailitValues } from '../common/values';

export const listDomainsAction = createAction({
  auth: emailitAuth,
  name: 'list_domains',
  displayName: 'List Sending Domains',
  description: 'List the sending domains of the workspace with their verification status.',
  audience: 'both',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the Emailit workspace\'s sending domains (id, name, verification_status and per-record SPF/DKIM/return-path status), one page at a time {items, count, page, hasMore}. Use it to find a verified domain to send from. Read-only; needs a Full Access key.',
    idempotent: true,
  },
  outputSchema: emailitSchemas.domainList,
  props: {
    search: Property.ShortText({ displayName: 'Search', description: 'Part of the domain name.', required: false }),
    limit: emailitProps.limit(),
    page: emailitProps.page(),
  },
  async run({ auth, propsValue }) {
    const page = emailitClient.page(propsValue.page);
    const body = await emailitClient.request({
      auth,
      method: HttpMethod.GET,
      path: '/domains',
      query: { search: emailitValues.optionalText(propsValue.search), limit: emailitClient.clampLimit(propsValue.limit), page },
    });
    const { items, hasMore, totalRecords } = emailitClient.listPage(body);
    return { items, count: items.length, page, hasMore, totalRecords };
  },
});
