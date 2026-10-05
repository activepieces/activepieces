import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { googleContactsAuth } from '../auth';
import { googleContactsApi } from '../common';
import { googleContactsGroup } from '../common/contact-group';
import { createContactGroupOutputSchema } from '../output-schemas';

const maxPages = 10;

async function findGroupByName({
  accessToken,
  name,
}: {
  accessToken: string;
  name: string;
}): Promise<unknown | undefined> {
  let pageToken: string | undefined = undefined;
  for (let page = 0; page < maxPages; page++) {
    const response: Record<string, unknown> = await googleContactsApi.sendRequest({
      accessToken,
      method: HttpMethod.GET,
      path: '/contactGroups',
      queryParams: {
        groupFields: googleContactsApi.contactGroupFields.join(','),
        pageSize: '1000',
        pageToken,
      },
    });
    const match = googleContactsApi
      .readArray({ source: response, path: ['contactGroups'] })
      .find((group) => googleContactsGroup.matchesName({ group, name }));
    if (match !== undefined) {
      return match;
    }
    pageToken = googleContactsApi.readString({
      source: response,
      path: ['nextPageToken'],
    });
    if (pageToken === undefined) {
      return undefined;
    }
  }
  return undefined;
}

export const googleContactsCreateContactGroupAction = createAction({
  auth: googleContactsAuth,
  name: 'create_contact_group',
  classification: 'WRITE',
  displayName: 'Create Contact Group',
  description: 'Create a contact group, or return the existing one with that name.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a contact group (label) with the given name in the connected Google account, or returns the existing group when one already carries that name, reporting which happened through the created flag. Use it before Add Or Remove Contact Group Members when the target group may not exist yet. Safe to retry: the lookup runs first and a duplicate-name rejection is resolved by returning the existing group.',
    idempotent: true,
  },
  outputSchema: createContactGroupOutputSchema,
  props: {
    name: Property.ShortText({
      displayName: 'Group Name',
      description: 'Name of the contact group to find or create.',
      required: true,
    }),
  },
  async run(context) {
    const name = context.propsValue.name.trim();
    if (name.length === 0) {
      throw new Error('Group Name must not be empty.');
    }
    const accessToken = context.auth.access_token;
    try {
      const existing = await findGroupByName({ accessToken, name });
      if (existing !== undefined) {
        return {
          created: false,
          contactGroup: googleContactsGroup.summarizeGroup({ group: existing }),
        };
      }
    } catch (error) {
      throw googleContactsApi.toApiError({
        error,
        operation: 'Create Contact Group (looking up existing groups)',
      });
    }
    try {
      const response = await googleContactsApi.sendRequest({
        accessToken,
        method: HttpMethod.POST,
        path: '/contactGroups',
        body: {
          contactGroup: { name },
          readGroupFields: googleContactsApi.contactGroupFields.join(','),
        },
      });
      return {
        created: true,
        contactGroup: googleContactsGroup.summarizeGroup({ group: response }),
      };
    } catch (error) {
      if (!googleContactsApi.isConflict({ error })) {
        throw googleContactsApi.toApiError({
          error,
          operation: 'Create Contact Group',
        });
      }
      const raced = await findGroupByName({ accessToken, name });
      if (raced === undefined) {
        throw googleContactsApi.toApiError({
          error,
          operation: 'Create Contact Group',
        });
      }
      return {
        created: false,
        contactGroup: googleContactsGroup.summarizeGroup({ group: raced }),
      };
    }
  },
});
