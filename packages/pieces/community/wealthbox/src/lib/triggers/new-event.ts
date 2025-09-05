import {
  createTrigger,
  TriggerStrategy,
  Property
} from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod
} from '@activepieces/pieces-common';
import {
  pollingHelper,
  DedupeStrategy,
  Polling
} from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { fetchContacts, fetchProjects, fetchOpportunities, fetchEventCategories, WEALTHBOX_API_BASE, handleApiError } from '../common';

const polling: Polling<any, any> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ propsValue, lastFetchEpochMS, auth }) => {
    if (!auth) {
      throw new Error('Authentication is required');
    }

    const searchParams = new URLSearchParams();

    searchParams.append('limit', '100');

    if (propsValue.resource_type) searchParams.append('resource_type', propsValue.resource_type);

    const resourceRecord = (propsValue as any).resource_record;
    if (resourceRecord?.resource_id) {
      searchParams.append('resource_id', resourceRecord.resource_id.toString());
    }

    if (propsValue.event_category) searchParams.append('event_category', propsValue.event_category);

    if (propsValue.start_date_min) searchParams.append('start_date_min', dayjs(propsValue.start_date_min).toISOString());
    if (propsValue.start_date_max) searchParams.append('start_date_max', dayjs(propsValue.start_date_max).toISOString());

    searchParams.append('order', 'created');

    if (lastFetchEpochMS) {
      const lastFetchDate = dayjs(lastFetchEpochMS - 1000).toISOString();
      searchParams.append('updated_since', lastFetchDate);
    }

    const queryString = searchParams.toString();
    const url = queryString ? `${WEALTHBOX_API_BASE}/events?${queryString}` : `${WEALTHBOX_API_BASE}/events`;

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: url,
        headers: {
          'ACCESS_TOKEN': auth as unknown as string,
          'Accept': 'application/json'
        }
      });

      if (response.status >= 400) {
        handleApiError('poll new events', response.status, response.body);
      }

      const events = response.body.events || [];

      const newEvents = events.filter((event: any) => {
        if (!lastFetchEpochMS) return true;

        const eventCreatedAt = dayjs(event.created_at).valueOf();
        return eventCreatedAt > lastFetchEpochMS;
      });

      return newEvents.map((event: any) => ({
        epochMilliSeconds: dayjs(event.created_at).valueOf(),
        data: event
      }));
    } catch (error) {
      throw new Error(`Failed to poll new events: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
};

export const newEvent = createTrigger({
  name: 'new_event',
  displayName: 'New Event',
  description: 'Fires when a new event is created',
  type: TriggerStrategy.POLLING,
  props: {
    resource_type: Property.StaticDropdown({
      displayName: 'Linked Resource Type',
      description: 'Only trigger for events linked to this type of resource (optional)',
      required: false,
      options: {
        options: [
          { label: 'Contact', value: 'Contact' },
          { label: 'Project', value: 'Project' },
          { label: 'Opportunity', value: 'Opportunity' }
        ]
      }
    }),

    resource_record: Property.DynamicProperties({
      displayName: 'Linked Resource',
      description: 'Select the specific resource to filter events by',
      required: false,
      refreshers: ['resource_type'],
      props: async ({ auth, resource_type }) => {
        if (!auth || !resource_type) {
          return {
            resource_id: Property.Number({
              displayName: 'Resource ID',
              description: 'Enter the resource ID manually',
              required: false
            })
          };
        }

        try {
          let records: any[] = [];
          let recordType = '';

          const resourceTypeValue = resource_type as unknown as string;

          switch (resourceTypeValue) {
            case 'Contact':
              records = await fetchContacts(auth as unknown as string, { active: true, order: 'recent' });
              recordType = 'Contact';
              break;
            case 'Project':
              records = await fetchProjects(auth as unknown as string);
              recordType = 'Project';
              break;
            case 'Opportunity':
              records = await fetchOpportunities(auth as unknown as string);
              recordType = 'Opportunity';
              break;
            default:
              return {
                resource_id: Property.Number({
                  displayName: 'Resource ID',
                  description: 'Enter the resource ID manually',
                  required: false
                })
              };
          }

          const recordOptions = records.map((record: any) => ({
            label: record.name || record.title || `${recordType} ${record.id}`,
            value: record.id
          }));

          return {
            resource_id: Property.StaticDropdown({
              displayName: `${recordType} Record`,
              description: `Select the ${recordType.toLowerCase()} to filter events by`,
              required: false,
              options: {
                options: recordOptions
              }
            })
          };
        } catch (error) {
          console.warn('Could not fetch resource options for validation:', error);
          return {
            resource_id: Property.Number({
              displayName: 'Resource ID',
              description: 'Enter the resource ID manually (API unavailable)',
              required: false
            })
          };
        }
      }
    }),

    event_category: Property.Dropdown({
      displayName: 'Event Category',
      description: 'Only trigger for events of this category (optional)',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) return { options: [] };

        try {
          const categories = await fetchEventCategories(auth as unknown as string);
          return {
            options: categories.map((category: any) => ({
              label: category.name || `Category ${category.id}`,
              value: category.id
            }))
          };
        } catch (error) {
          return {
            options: [],
            error: 'Failed to load event categories. Please check your authentication.'
          };
        }
      }
    }),

    start_date_min: Property.DateTime({
      displayName: 'Start Date Minimum',
      description: 'Only trigger for events starting on or after this date/time',
      required: false
    }),

    start_date_max: Property.DateTime({
      displayName: 'Start Date Maximum',
      description: 'Only trigger for events starting on or before this date/time',
      required: false
    }),

    order: Property.StaticDropdown({
      displayName: 'Sort Order',
      description: 'How to order the events',
      required: false,
      options: {
        options: [
          { label: 'Recent (newest first)', value: 'recent' },
          { label: 'Created Date (newest first)', value: 'created' },
          { label: 'Start Date (ascending)', value: 'asc' },
          { label: 'Start Date (descending)', value: 'desc' }
        ]
      }
    })
  },
  sampleData: {
    id: 1,
    creator: 1,
    created_at: '2015-05-24 10:00 AM -0400',
    updated_at: '2015-10-12 11:30 PM -0400',
    title: 'Client Meeting',
    starts_at: '2015-05-24 10:00 AM -0400',
    ends_at: '2015-05-24 11:00 AM -0400',
    repeats: true,
    event_category: 2,
    all_day: true,
    location: 'Conference Room',
    description: 'Review meeting for Kevin...',
    state: 'confirmed',
    visible_to: 'Everyone',
    email_invitees: true,
    linked_to: [
      {
        id: 1,
        type: 'Contact',
        name: 'Kevin Anderson'
      }
    ],
    invitees: [
      {
        id: 1,
        type: 'Contact',
        name: 'Kevin Anderson'
      }
    ],
    custom_fields: [
      {
        id: 1,
        name: 'My Field',
        value: '123456789',
        document_type: 'Contact',
        field_type: 'single_select'
      }
    ]
  },

  onEnable: async (context) => {
    await pollingHelper.onEnable(polling, {
      store: context.store,
      propsValue: context.propsValue,
      auth: context.auth
    });
  },

  onDisable: async (context) => {
    await pollingHelper.onDisable(polling, {
      store: context.store,
      propsValue: context.propsValue,
      auth: context.auth
    });
  },

  run: async (context) => {
    return await pollingHelper.poll(polling, context);
  },

  test: async (context) => {
    return await pollingHelper.test(polling, context);
  }
});
