import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';
import { zohoBooksUtils } from '../../../common/utils';

export const listAllContactPersonsAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_list_all_contact_persons',
  displayName: 'List All Contact Persons',
  description: 'Lists contact persons across all contacts in a Zoho Books organization.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists contact persons of every contact in the organization, with their contact_person_id and contact_id. Use List Contact Persons instead for the persons of one contact. Returns one page; page_context.has_more_page tells whether to fetch the next page.',
    idempotent: true,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    page: zohoBooksAiProps.page(),
    perPage: zohoBooksAiProps.perPage(),
  },
  async run(context) {
    const { page, perPage } = context.propsValue;
    const organizationId = await zohoBooksApi.resolveOrganizationId({
      auth: context.auth,
      organizationId: context.propsValue.organizationId,
    });
    return await zohoBooksClient.request({
      auth: context.auth,
      method: HttpMethod.GET,
      path: '/contacts/contactpersons',
      query: {
        organization_id: organizationId,
        ...zohoBooksUtils.pageQuery({ page, perPage }),
      },
    });
  },
});
