import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { googleContactsAuth } from '../auth';
import { googleContactsApi } from '../common';
import { googleContactsGroup } from '../common/contact-group';
import { getContactGroupOutputSchema } from '../output-schemas';

export const googleContactsGetContactGroupAction = createAction({
  auth: googleContactsAuth,
  name: 'get_contact_group',
  classification: 'READ',
  displayName: 'Get Contact Group',
  description: 'Read one contact group, optionally with its member resource names.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Reads one Google Contacts group by its opaque resourceName (contactGroups/{id}) and returns its name, type, member count and, when Max Members is above zero, the resource names of its members. Resolve the resourceName with List Contact Groups; use Batch Get Contact Groups for several groups. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: getContactGroupOutputSchema,
  props: {
    resourceName: Property.ShortText({
      displayName: 'Resource Name',
      description:
        'Opaque contact group resource name such as contactGroups/abc123, or a system group like contactGroups/myContacts. Resolve it with List Contact Groups.',
      required: true,
    }),
    maxMembers: Property.Number({
      displayName: 'Max Members',
      description:
        'How many member resource names to return. Defaults to 0, which returns none.',
      required: false,
    }),
  },
  async run(context) {
    const resourceName = context.propsValue.resourceName.trim();
    const maxMembers = Math.max(0, context.propsValue.maxMembers ?? 0);
    try {
      const response = await googleContactsApi.sendRequest({
        accessToken: context.auth.access_token,
        method: HttpMethod.GET,
        path: `/${resourceName}`,
        queryParams: {
          groupFields: googleContactsApi.contactGroupFields.join(','),
          maxMembers: String(maxMembers),
        },
      });
      return googleContactsGroup.summarizeGroup({ group: response });
    } catch (error) {
      throw googleContactsApi.toApiError({
        error,
        operation: 'Get Contact Group',
      });
    }
  },
});
