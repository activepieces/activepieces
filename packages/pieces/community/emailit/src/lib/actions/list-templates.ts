import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { emailitAuth } from '../auth';
import { emailitClient } from '../common/client';
import { emailitSchemas } from '../common/output-schemas';
import { emailitProps } from '../common/props';
import { emailitValues } from '../common/values';

export const listTemplatesAction = createAction({
  auth: emailitAuth,
  name: 'list_templates',
  displayName: 'List Templates',
  description: 'List the published email templates of the workspace.',
  audience: 'both',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the published version of each Emailit template (id, name, alias, subject, editor), newest first, one page at a time {items, count, page, hasMore, totalRecords}. Pass a template\'s alias or id as Template when sending. Content is not included. Read-only; needs a Full Access key.',
    idempotent: true,
  },
  outputSchema: emailitSchemas.templateList,
  props: {
    name: Property.ShortText({ displayName: 'Name Contains', description: 'Part of the template name or alias.', required: false }),
    limit: emailitProps.limit(),
    page: emailitProps.page(),
  },
  async run({ auth, propsValue }) {
    const page = emailitClient.page(propsValue.page);
    const body = await emailitClient.request({
      auth,
      method: HttpMethod.GET,
      path: '/templates',
      query: { 'filter[name]': emailitValues.optionalText(propsValue.name), per_page: emailitClient.clampLimit(propsValue.limit), page },
    });
    const { items, hasMore, totalRecords } = emailitClient.listPage(body);
    return { items, count: items.length, page, hasMore, totalRecords };
  },
});
