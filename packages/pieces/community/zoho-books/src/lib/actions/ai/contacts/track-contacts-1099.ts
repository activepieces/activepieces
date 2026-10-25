import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';
import { zohoBooksUtils } from '../../../common/utils';

export const trackContacts1099Action = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_track_contacts_1099',
  displayName: 'Track Contacts for 1099',
  description: 'Marks several Zoho Books contacts for 1099 tracking at once.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Turns on 1099 tracking for up to 200 vendors in one call. Only for organizations in the US edition. Use Track Contact 1099 for a single contact and Untrack Contact 1099 to stop.',
    idempotent: true,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    contactIds: Property.Array({
      displayName: 'Contact IDs',
      description:
        'Up to 200 contact IDs, from List Contacts, e.g. ["460000000026049", "460000000026050"].',
      required: true,
    }),
  },
  async run(context) {
    const { contactIds } = context.propsValue;
    const contactIdsList = zohoBooksUtils.toStringList({
      value: contactIds,
      propName: 'Contact IDs',
    });
    const organizationId = await zohoBooksApi.resolveOrganizationId({
      auth: context.auth,
      organizationId: context.propsValue.organizationId,
    });
    return await zohoBooksClient.request({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/contacts/track1099',
      query: { organization_id: organizationId, contact_ids: contactIdsList.join(',') },
    });
  },
});
