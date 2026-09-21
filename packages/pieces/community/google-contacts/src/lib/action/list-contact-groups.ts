import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { googleContactsAuth } from '../auth';
import { googleContactsApi } from '../common';
import { googleContactsGroup } from '../common/contact-group';
import { listContactGroupsOutputSchema } from '../output-schemas';

const maxPages = 10;

export const googleContactsListContactGroupsAction = createAction({
  auth: googleContactsAuth,
  name: 'list_contact_groups',
  classification: 'READ',
  displayName: 'List Contact Groups',
  description: 'List every contact group of the connected Google account.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the contact groups (labels) of the connected Google account with the opaque resourceName, name, type and member count of each. Use it to resolve a group name to its resourceName before Get Contact Group, Update Contact Group, Delete Contact Group or Add Or Remove Contact Group Members. Member resource names are not included here — read a single group with Get Contact Group for those. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: listContactGroupsOutputSchema,
  props: {},
  async run(context) {
    const groups: Record<string, unknown>[] = [];
    let pageToken: string | undefined = undefined;
    try {
      for (let page = 0; page < maxPages; page++) {
        const response: Record<string, unknown> =
          await googleContactsApi.sendRequest({
            accessToken: context.auth.access_token,
            method: HttpMethod.GET,
            path: '/contactGroups',
            queryParams: {
              groupFields: googleContactsApi.contactGroupFields.join(','),
              pageSize: '1000',
              pageToken,
            },
          });
        for (const group of googleContactsApi.readArray({
          source: response,
          path: ['contactGroups'],
        })) {
          groups.push(googleContactsGroup.summarizeGroup({ group }));
        }
        pageToken = googleContactsApi.readString({
          source: response,
          path: ['nextPageToken'],
        });
        if (pageToken === undefined) {
          break;
        }
      }
    } catch (error) {
      throw googleContactsApi.toApiError({
        error,
        operation: 'List Contact Groups',
      });
    }
    return { contactGroups: groups, count: groups.length };
  },
});
