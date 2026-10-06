import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { googleContactsAuth } from '../auth';
import { googleContactsApi } from '../common';
import { getContactOutputSchema } from '../output-schemas';

export const googleContactsGetContactAction = createAction({
  auth: googleContactsAuth,
  name: 'get_contact',
  classification: 'READ',
  displayName: 'Get Contact',
  description: 'Read a single contact by its resource name.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Reads one Google Contacts person by its opaque resourceName (people/{id}) and returns names, emails, phone numbers, organizations, memberships and the current etag. Obtain the resourceName from List Contacts or Search Contacts; do not construct or parse it. Use Batch Get Contacts for more than one contact. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: getContactOutputSchema,
  props: {
    resourceName: Property.ShortText({
      displayName: 'Resource Name',
      description:
        'Opaque contact resource name such as people/c12345. Resolve it with List Contacts or Search Contacts.',
      required: true,
    }),
  },
  async run(context) {
    const resourceName = context.propsValue.resourceName.trim();
    try {
      return await googleContactsApi.sendRequest({
        accessToken: context.auth.access_token,
        method: HttpMethod.GET,
        path: `/${resourceName}`,
        queryParams: {
          personFields: googleContactsApi.contactReadMask.join(','),
        },
      });
    } catch (error) {
      throw googleContactsApi.toApiError({ error, operation: 'Get Contact' });
    }
  },
});
