import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { googleContactsAuth } from '../auth';
import { googleContactsApi } from '../common';
import { googleContactsPerson } from '../common/person';
import { listContactsOutputSchema } from '../output-schemas';

const maxPages = 10;

export const googleContactsListContactsAction = createAction({
  auth: googleContactsAuth,
  name: 'list_contacts',
  classification: 'READ',
  displayName: 'List Contacts',
  description: 'List the contacts of the connected Google account.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the connected account contacts with the resourceName and etag every write action needs, plus display name, emails, phone numbers and organization. Use this to resolve a person name to a resourceName before Update Contact Fields, Delete Contact or group membership changes; use Search Contacts when you already have a query string. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: listContactsOutputSchema,
  props: {
    maxResults: Property.Number({
      displayName: 'Max Results',
      description: 'Maximum number of contacts to return. Defaults to 200.',
      required: false,
    }),
  },
  async run(context) {
    const limit = context.propsValue.maxResults ?? 200;
    const collected: Record<string, unknown>[] = [];
    let pageToken: string | undefined = undefined;
    try {
      for (let page = 0; page < maxPages; page++) {
        const pageSize = Math.min(1000, Math.max(1, limit - collected.length));
        const response: Record<string, unknown> =
          await googleContactsApi.sendRequest({
            accessToken: context.auth.access_token,
            method: HttpMethod.GET,
            path: '/people/me/connections',
            queryParams: {
              personFields: googleContactsApi.contactReadMask.join(','),
              pageSize: String(pageSize),
              pageToken,
            },
          });
        const connections = googleContactsApi.readArray({
          source: response,
          path: ['connections'],
        });
        for (const person of connections) {
          collected.push(googleContactsPerson.summarizePerson({ person }));
        }
        pageToken = googleContactsApi.readString({
          source: response,
          path: ['nextPageToken'],
        });
        if (pageToken === undefined || collected.length >= limit) {
          break;
        }
      }
    } catch (error) {
      throw googleContactsApi.toApiError({ error, operation: 'List Contacts' });
    }
    const contacts = collected.slice(0, limit);
    return {
      contacts,
      count: contacts.length,
      hasMore: pageToken !== undefined,
    };
  },
});
