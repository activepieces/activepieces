import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { biginZohoAuth } from '../../index';
import { makeRequest } from '../common';
import { BiginZohoAuthType } from '../common/auth';

export const updateEvent = createAction({
  auth: biginZohoAuth,
  name: 'updateEvent',
  displayName: 'Update Event',
  description: 'Modify an event\'s details',
  props: {
    recordId: Property.Dropdown({
      displayName: 'Event',
      description: 'Select the event to update',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        try {
          const response = await makeRequest(
            (auth as BiginZohoAuthType).access_token,
            HttpMethod.GET,
            '/Events',
            (auth as BiginZohoAuthType).location || 'com'
          );
          const events = response.data || [];
          return {
            disabled: false,
            options: events.map((event: any) => ({
              label: event.Event_Title,
              value: event.id,
            })),
          };
        } catch (error) {
          return {
            disabled: true,
            options: [],
          };
        }
      },
    }),
    eventTitle: Property.ShortText({
      displayName: 'Event Title',
      description: 'Provide the title or name of the event',
      required: false,
    }),
    startDateTime: Property.DateTime({
      displayName: 'Start Date Time',
      description: 'Provide the start date and time (ISO8601) of the event',
      required: false,
    }),
    endDateTime: Property.DateTime({
      displayName: 'End Date Time',
      description: 'Provide the end date and time (ISO8601) of the event',
      required: false,
    }),
    owner: Property.Dropdown({
      displayName: 'Owner',
      description: 'Select the owner of the event',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        try {
          const response = await makeRequest(
            (auth as BiginZohoAuthType).access_token,
            HttpMethod.GET,
            '/users',
            (auth as BiginZohoAuthType).location || 'com'
          );
          const users = response.users || [];
          return {
            disabled: false,
            options: users.map((user: any) => ({
              label: user.full_name || `${user.first_name} ${user.last_name}`,
              value: user.id,
            })),
          };
        } catch (error) {
          return {
            disabled: true,
            options: [],
          };
        }
      },
    }),
    allDay: Property.Checkbox({
      displayName: 'All Day',
      description: 'Provide whether the event is an all-day event',
      required: false,
    }),
    venue: Property.ShortText({
      displayName: 'Venue',
      description: 'Provide the location or venue of the event',
      required: false,
    }),
    relatedTo: Property.Dropdown({
      displayName: 'Related To',
      description: 'Select the related record',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        try {
          const response = await makeRequest(
            (auth as BiginZohoAuthType).access_token,
            HttpMethod.GET,
            '/Pipelines',
            (auth as BiginZohoAuthType).location || 'com'
          );
          const deals = response.data || [];
          return {
            disabled: false,
            options: deals.map((deal: any) => ({
              label: deal.Deal_Name,
              value: deal.id,
            })),
          };
        } catch (error) {
          return {
            disabled: true,
            options: [],
          };
        }
      },
    }),
    relatedModule: Property.ShortText({
      displayName: 'Related Module',
      description: 'Provide the type of entity the event is linked to',
      required: false,
    }),
    participants: Property.Array({
      displayName: 'Participants',
      description: 'Provide the unique ID(s) of the user(s) participating in the event',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Provide additional descriptions or notes related to the event',
      required: false,
    }),
    tag: Property.Array({
      displayName: 'Tag',
      description: 'Tags for the event',
      required: false,
    }),
  },
  async run(context) {
    const body: Record<string, unknown> = {
      id: context.propsValue.recordId,
    };

    if (context.propsValue.eventTitle) body['Event_Title'] = context.propsValue.eventTitle;
    if (context.propsValue.startDateTime) body['Start_DateTime'] = new Date(context.propsValue.startDateTime).toISOString().replace('Z', '+00:00');
    if (context.propsValue.endDateTime) body['End_DateTime'] = new Date(context.propsValue.endDateTime).toISOString().replace('Z', '+00:00');
    if (context.propsValue.owner) body['Owner'] = { id: context.propsValue.owner };
    if (context.propsValue.allDay !== undefined) body['All_day'] = context.propsValue.allDay;
    if (context.propsValue.venue) body['Venue'] = context.propsValue.venue;
    if (context.propsValue.relatedTo) body['Related_To'] = { id: context.propsValue.relatedTo };
    if (context.propsValue.relatedModule) body['$related_module'] = context.propsValue.relatedModule;
    if (context.propsValue.participants) body['Participants'] = context.propsValue.participants;
    if (context.propsValue.description) body['Description'] = context.propsValue.description;
    if (context.propsValue.tag && context.propsValue.tag.length > 0) {
      body['Tag'] = context.propsValue.tag.map((tag: unknown) => ({ name: tag as string }));
    }

    const response = await makeRequest(
      context.auth.access_token,
      HttpMethod.PUT,
      '/Events',
      context.auth.props?.['location'] || 'com',
      { data: [body] }
    );

    return response.data[0];
  },
}); 