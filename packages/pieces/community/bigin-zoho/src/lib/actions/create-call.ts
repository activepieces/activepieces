import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { biginZohoAuth } from '../../index';
import { makeRequest, userIdDropdown, contactIdDropdown, pipelineIdDropdown, tagDropdown, formatDateTime } from '../common';

export const createCall = createAction({
  auth: biginZohoAuth,
  name: 'createCall',
  displayName: 'Create Call',
  description: 'Create a new call record in Bigin',
  props: {
    callStartTime: Property.DateTime({
      displayName: 'Call Start Time',
      description: 'When the call started (ISO8601 format)',
      required: true,
    }),
    callDuration: Property.ShortText({
      displayName: 'Call Duration',
      description: 'Duration of the call in MM:SS format (e.g., "90:00" for 90 minutes)',
      required: true,
    }),
    callType: Property.StaticDropdown({
      displayName: 'Call Type',
      description: 'Type of call',
      required: true,
      options: {
        options: [
          { label: 'Outbound', value: 'Outbound' },
          { label: 'Inbound', value: 'Inbound' },
          { label: 'Missed', value: 'Missed' },
        ],
      },
    }),
    owner: userIdDropdown,
    contactName: contactIdDropdown,
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'Subject of the call',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Description or notes about the call',
      required: false,
    }),
    callAgenda: Property.LongText({
      displayName: 'Call Agenda',
      description: 'Agenda or purpose of the call',
      required: false,
    }),
    reminder: Property.DateTime({
      displayName: 'Reminder',
      description: 'Reminder date and time for the call',
      required: false,
    }),
    dialledNumber: Property.ShortText({
      displayName: 'Dialled Number',
      description: 'Phone number that was dialled',
      required: false,
    }),
    relatedTo: pipelineIdDropdown,
    relatedModule: Property.StaticDropdown({
      displayName: 'Related Module',
      description: 'The module this call is related to',
      required: false,
      options: {
        options: [
          { label: 'Deals', value: 'Deals' },
          { label: 'Contacts', value: 'Contacts' },
          { label: 'Companies', value: 'Companies' },
          { label: 'Events', value: 'Events' },
          { label: 'Tasks', value: 'Tasks' },
        ],
      },
    }),
    tags: tagDropdown('Calls'),
  },
  async run(context) {
    const callStartTime = context.propsValue.callStartTime;
    const formattedStartTime = formatDateTime(callStartTime);
    const formattedReminder = context.propsValue.reminder 
      ? formatDateTime(context.propsValue.reminder)
      : undefined;

    const body: Record<string, unknown> = {
      Call_Start_Time: formattedStartTime,
      Call_Duration: context.propsValue.callDuration,
      Call_Type: context.propsValue.callType,
    };

    if (context.propsValue.owner) {
      body['Owner'] = { id: context.propsValue.owner };
    }
    if (context.propsValue.contactName) {
      body['Contact_Name'] = { id: context.propsValue.contactName };
    }
    if (context.propsValue.subject) {
      body['Subject'] = context.propsValue.subject;
    }
    if (context.propsValue.description) {
      body['Description'] = context.propsValue.description;
    }
    if (context.propsValue.callAgenda) {
      body['Call_Agenda'] = context.propsValue.callAgenda;
    }
    if (formattedReminder) {
      body['Reminder'] = formattedReminder;
    }
    if (context.propsValue.dialledNumber) {
      body['Dialled_Number'] = context.propsValue.dialledNumber;
    }
    if (context.propsValue.relatedTo) {
      body['Related_To'] = { id: context.propsValue.relatedTo };
    }
    if (context.propsValue.relatedModule) {
      body['$related_module'] = context.propsValue.relatedModule;
    }
    if (context.propsValue.tags) {
      body['Tag'] = context.propsValue.tags;
    }

    const response = await makeRequest(
      context.auth.access_token,
      HttpMethod.POST,
      '/Calls',
      context.auth.props?.['location'] || 'com',
      { data: [body] }
    );

    return response.data[0];
  },
}); 