import {
  AppConnectionValueForAuthProperty,
  createTrigger,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import {
  Polling,
  DedupeStrategy,
  pollingHelper,
} from '@activepieces/pieces-common';
import { createGoogleClient, googleContactsAuth } from '../auth';
import { newOrUpdatedContactOutputSchema } from '../output-schemas';
import { people as googlePeople, people_v1 } from '@googleapis/people';
import dayjs from 'dayjs';

const polling: Polling<AppConnectionValueForAuthProperty<typeof googleContactsAuth>, Record<string, never>> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, lastFetchEpochMS }) => {
    const contactsClient = googlePeople({ version: 'v1', auth: createGoogleClient(auth) });

    let nextPageToken: string | undefined;
    let contactItems: ContactItem[] = [];

    do {
      const response = await contactsClient.people.connections.list({
        resourceName: 'people/me',
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

      const pageItems = (response.data.connections ?? [])
        .filter((contact) => contact.metadata?.deleted !== true)
        .flatMap((contact) => toContactItems(contact));
      contactItems = [...contactItems, ...pageItems];

      const lastPageItem = pageItems[pageItems.length - 1];
      const reachedSeenContacts =
        lastFetchEpochMS > 0 &&
        lastPageItem !== undefined &&
        lastPageItem.epochMilliSeconds < lastFetchEpochMS;
      nextPageToken = reachedSeenContacts
        ? undefined
        : response.data.nextPageToken ?? undefined;
    } while (nextPageToken);

    return contactItems;
  },
};

export const googleContactNewOrUpdatedContact = createTrigger({
  auth: googleContactsAuth,
  name: 'new_or_updated_contact',
  classification: 'READ',
  displayName: 'New or Updated Contact',
  description: 'Runs when a contact is added or edited in Google Contacts.',
  aiMetadata: {
    description: 'Fires when a contact in the authenticated Google Contacts account is newly created or has been modified since the last poll. Each event represents one person record with its current fields; deleted contacts are excluded.',
  },
  props: {},
  outputSchema: newOrUpdatedContactOutputSchema,
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
    return await pollingHelper.onEnable(polling, ctx);
  },
  async onDisable(ctx) {
    return await pollingHelper.onDisable(polling, ctx);
  },
  async run(ctx) {
    return await pollingHelper.poll(polling, ctx);
  },
  test: async (ctx) => {
    return await pollingHelper.test(polling, ctx);
  },
});

function toContactItems(contact: people_v1.Schema$Person): ContactItem[] {
  const epochMilliSeconds = contactUpdateTime(contact);
  return epochMilliSeconds === undefined ? [] : [{ data: contact, epochMilliSeconds }];
}

function contactUpdateTime(contact: people_v1.Schema$Person): number | undefined {
  const sources = contact.metadata?.sources ?? [];
  const contactSourceTimes = sourceUpdateTimes(
    sources.filter((source) => source.type === 'CONTACT')
  );
  if (contactSourceTimes.length > 0) {
    return Math.max(...contactSourceTimes);
  }
  const otherSourceTimes = sourceUpdateTimes(
    sources.filter((source) => source.type !== 'CONTACT')
  );
  return otherSourceTimes.length > 0 ? Math.max(...otherSourceTimes) : undefined;
}

function sourceUpdateTimes(sources: people_v1.Schema$Source[]): number[] {
  return sources
    .map((source) => source.updateTime)
    .filter((updateTime): updateTime is string => typeof updateTime === 'string' && updateTime.length > 0)
    .map((updateTime) => dayjs(updateTime))
    .filter((time) => time.isValid())
    .map((time) => time.valueOf());
}

type ContactItem = {
  data: people_v1.Schema$Person;
  epochMilliSeconds: number;
};
