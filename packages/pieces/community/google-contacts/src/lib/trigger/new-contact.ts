import {
  createTrigger,
  OAuth2PropertyValue,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import {
  getAccessTokenOrThrow,
  HttpResponse,
  httpClient,
  HttpMethod,
  AuthenticationType,
  Polling,
  DedupeStrategy,
  pollingHelper,
} from '@activepieces/pieces-common';
import { googleContactsCommon } from '../common';
import { googleContactsAuth } from '../../';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';
import dayjs from 'dayjs';

const polling: Polling<OAuth2PropertyValue, Record<string, never>> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ store, auth }) => {
    const authClient = new OAuth2Client();
    authClient.setCredentials(auth);

    const contactsClient = google.people({ version: 'v1', auth: authClient });

    let nextPageToken;
    const contactItems: Array<{ data: any; epochMilliSeconds: number }> = [];

    do {
      const response: any = await contactsClient.people.connections.list({
        pageToken: nextPageToken,
        pageSize: 100,
        sortOrder: 'LAST_MODIFIED_DESCENDING',
        personFields: [
          'addresses',
          'ageRanges',
          'biographies',
          'birthdays',
          'calendarUrls',
          'clientData',
          'coverPhotos',
          'emailAddresses',
          'events',
          'externalIds',
          'genders',
          'imClients',
          'interests',
          'locales',
          'locations',
          'memberships',
          'metadata',
          'miscKeywords',
          'names',
          'nicknames',
          'occupations',
          'organizations',
          'phoneNumbers',
          'photos',
          'relations',
          'sipAddresses',
          'skills',
          'urls',
          'userDefined',
        ].join(),
      });

      console.log(JSON.stringify(response.data, null, 2));

      for (const contact of response.data.connections || []) {
        if (contact.metadata?.deleted !== true) {
          contactItems.push({
            data: contact,
            epochMilliSeconds: dayjs(
              contact.metadata?.sources?.[0].updateTime
            ).valueOf(),
          });
        }
      }

      nextPageToken = response.data.nextPageToken;
    } while (nextPageToken);

    return contactItems;
  },
};

// const polling: Polling<OAuth2PropertyValue, Record<string, never>> = {
//   strategy: DedupeStrategy.LAST_ITEM,
//   items: async ({ store, auth }) => {
//     let newContacts: Connection[] = [];
//     let fetchMore = true;
//     while (fetchMore) {
//       const syncToken = (await store.get<string>('syncToken'))!;
//       const response = await listContacts(
//         getAccessTokenOrThrow(auth),
//         syncToken
//       );
//       const newConnections = response.body.connections;
//       await store.put('syncToken', response.body.nextSyncToken);
//       if (newConnections === undefined || newConnections.length == 0) {
//         fetchMore = false;
//       }
//       if (newConnections !== undefined) {
//         newContacts = [...newContacts, ...newConnections];
//       }
//     }
//     console.log(`Found ${newContacts.length} new contacts`);
//     newContacts = newContacts.filter((f) => {
//       return f.metadata.deleted !== true;
//     });

//     return newContacts.map((item) => ({
//       id: newContacts.indexOf(item),
//       data: item,
//     }));
//   },
// };

export const googleContactNewOrUpdatedContact = createTrigger({
  auth: googleContactsAuth,
  name: 'new_or_updated_contact',
  displayName: 'New Or Updated Contact',
  description: 'Triggers when there is a new or updated contact',
  props: {},
  sampleData: {
    resourceName: 'people/c4278485694217203807',
    etag: '%EiMBAgMFBgcICQoLDA0ODxATFBUWGSEiIyQlJicuNDU3PT4/QBoEAQIFByIMZFVwNlJPNEVKUzg9',
    metadata: {
      sources: [
        {
          type: 'CONTACT',
          id: '3b603c120c68305f',
          etag: '#dUp6RO4EJS8=',
          updateTime: '2023-01-30T14:35:18.142565Z',
        },
      ],
      objectType: 'PERSON',
    },
    names: [
      {
        metadata: {
          primary: true,
          source: {
            type: 'CONTACT',
            id: '3b603c120c68305f',
          },
        },
        displayName: 'Shahed Mashni',
        familyName: 'Mashni',
        givenName: 'Shahed',
        displayNameLastFirst: 'Mashni, Shahed',
        unstructuredName: 'Shahed Mashni',
      },
    ],
    photos: [
      {
        metadata: {
          primary: true,
          source: {
            type: 'CONTACT',
            id: '3b603c120c68305f',
          },
        },
        url: 'https://lh3.googleusercontent.com/cm/AAkddurmZojs4vCcxrpkfSxH9tnqcH-hI82ESDnwv6eq86nZeLStcjYEIe_TCx8r8g5Y=s100',
        default: true,
      },
    ],
    memberships: [
      {
        metadata: {
          source: {
            type: 'CONTACT',
            id: '3b603c120c68305f',
          },
        },
        contactGroupMembership: {
          contactGroupId: 'myContacts',
          contactGroupResourceName: 'contactGroups/myContacts',
        },
      },
    ],
  },

  type: TriggerStrategy.POLLING,
  async onEnable(ctx) {
    return await pollingHelper.onEnable(polling, {
      store: ctx.store,
      auth: ctx.auth,
      propsValue: {},
    });
  },
  async onDisable(ctx) {
    return await pollingHelper.onEnable(polling, {
      store: ctx.store,
      auth: ctx.auth,
      propsValue: {},
    });
  },
  async run(ctx) {
    return await pollingHelper.poll(polling, {
      store: ctx.store,
      auth: ctx.auth,
      propsValue: {},
    });
  },
  test: async (ctx) => {
    return await pollingHelper.poll(polling, {
      store: ctx.store,
      auth: ctx.auth,
      propsValue: {},
    });
  },
});

function listContacts(
  access_token: string,
  syncToken: string | undefined
): Promise<HttpResponse<{ connections: Connection[]; nextSyncToken: string }>> {
  let qParams: Record<string, string> = {
    personFields:
      'addresses,ageRanges,biographies,birthdays,calendarUrls,clientData,coverPhotos,emailAddresses,events,externalIds,genders,imClients,interests,locales,locations,memberships,metadata,miscKeywords,names,nicknames,occupations,organizations,phoneNumbers,photos,relations,sipAddresses,skills,urls,userDefined',
    requestSyncToken: 'true',
  };
  if (syncToken !== undefined && syncToken !== null) {
    qParams = {
      ...qParams,
      syncToken: syncToken,
    };
  }
  return httpClient.sendRequest<{
    connections: Connection[];
    nextSyncToken: string;
  }>({
    method: HttpMethod.GET,
    url: googleContactsCommon.baseUrl + '/me/connections',
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: access_token,
    },
    queryParams: qParams,
  });
}

interface Connection {
  metadata: {
    deleted?: boolean;
  };
}
