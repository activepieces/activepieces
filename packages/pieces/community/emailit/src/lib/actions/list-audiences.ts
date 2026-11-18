import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { emailitAuth } from '../auth';
import { emailitClient } from '../common/client';
import { emailitSchemas } from '../common/output-schemas';
import { emailitProps } from '../common/props';
import { emailitValues } from '../common/values';

export const listAudiencesAction = createAction({
  auth: emailitAuth,
  name: 'list_audiences',
  displayName: 'List Audiences',
  description: 'List the audiences (subscriber lists) of the workspace.',
  audience: 'both',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists Emailit audiences (subscriber lists) newest first with id, name, subscriber count and plan usage, one page at a time {items, count, page, hasMore, totalRecords}. Use the id with the subscriber actions. Read-only; needs a Full Access key.',
    idempotent: true,
  },
  outputSchema: emailitSchemas.audienceList,
  props: {
    search: Property.ShortText({ displayName: 'Search', description: 'Part of the audience name.', required: false }),
    limit: emailitProps.limit(),
    page: emailitProps.page(),
  },
  async run({ auth, propsValue }) {
    const page = emailitClient.page(propsValue.page);
    const body = await emailitClient.request({
      auth,
      method: HttpMethod.GET,
      path: '/audiences',
      query: { search: emailitValues.optionalText(propsValue.search), limit: emailitClient.clampLimit(propsValue.limit), page },
    });
    const { items, hasMore, totalRecords } = emailitClient.listPage(body);
    return { items, count: items.length, page, hasMore, totalRecords };
  },
});
