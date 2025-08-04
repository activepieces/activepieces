import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { biginAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { userIdDropdown } from '../common/props';

export const createCall = createAction({
  auth: biginAuth,
  name: 'createCall',
  displayName: 'Create Call',
  description: 'Create a new call record in Bigin',
  props: {
    callStartTime: Property.DateTime({
      displayName: 'Call Start Time',
      description: 'When the call started (ISO8601 format)',
      required: true,
    }),
    callDuration: Property.Number({
      displayName: 'Call Duration',
      description: 'Duration of the call in minutes',
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
    contactName: Property.ShortText({
      displayName: 'Contact ID',
      description: 'The ID of the contact to which the call record is associated. You can get the contact ID from the Get records API.',
      required: false,
    }),
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
    callResult: Property.ShortText({
      displayName: 'Call Result',
      description: 'The result or outcome of the call',
      required: false,
    }),
    callPurpose: Property.StaticDropdown({
      displayName: 'Call Purpose',
      description: 'The purpose of the call',
      required: false,
      options: {
        options: [
          { label: 'Administrative', value: 'Administrative' },
          { label: 'Sales', value: 'Sales' },
          { label: 'Support', value: 'Support' },
          { label: 'Follow-up', value: 'Follow-up' },
        ],
      },
    }),
    reminder: Property.ShortText({
      displayName: 'Reminder',
      description: 'Reminder time (e.g., "10 mins", "1 hour")',
      required: false,
    }),
    billable: Property.Checkbox({
      displayName: 'Billable',
      description: 'Whether this call is billable',
      required: false,
      defaultValue: false,
    }),
    sendNotification: Property.Checkbox({
      displayName: 'Send Notification',
      description: 'Whether to send notification for this call',
      required: false,
      defaultValue: false,
    }),
    relatedTo: Property.ShortText({
      displayName: 'Related To',
      description: 'What this call is related to',
      required: false,
    }),
    relatedModule: Property.ShortText({
      displayName: 'Related Module',
      description: 'The module this call is related to',
      required: false,
    }),
    callAgenda: Property.Checkbox({
      displayName: 'Call Agenda',
      description: 'Whether call has an agenda',
      required: false,
      defaultValue: false,
    }),
    dialledNumber: Property.Checkbox({
      displayName: 'Dialled Number',
      description: 'Whether number was dialled',
      required: false,
      defaultValue: false,
    }),
    tag: Property.Checkbox({
      displayName: 'Tag',
      description: 'Tag for the call',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    // Format datetime for Bigin API - they expect YYYY-MM-DDTHH:mm:ss+HH:MM format
    const callStartTime = context.propsValue.callStartTime;
    let formattedStartTime: string;

    if (typeof callStartTime === 'string') {
      formattedStartTime = callStartTime;
    } else {
      const date = new Date(callStartTime);
      // Format as YYYY-MM-DDTHH:mm:ss+00:00 (Bigin expects timezone offset)
      formattedStartTime = date.toISOString().replace('.000Z', '+00:00');
    }

    const body: Record<string, unknown> = {
      Call_Start_Time: formattedStartTime,
      Call_Duration: context.propsValue.callDuration,
      Call_Type: context.propsValue.callType,
    };

    // Add optional fields if provided
    if (context.propsValue.owner) body['Owner'] = context.propsValue.owner;
    if (context.propsValue.contactName) body['Contact_Name'] = context.propsValue.contactName;
    if (context.propsValue.subject) body['Subject'] = context.propsValue.subject;
    if (context.propsValue.description) body['Description'] = context.propsValue.description;
    if (context.propsValue.callResult) body['Call_Result'] = context.propsValue.callResult;
    if (context.propsValue.callPurpose) body['Call_Purpose'] = context.propsValue.callPurpose;
    if (context.propsValue.reminder) body['Reminder'] = context.propsValue.reminder;
    if (context.propsValue.billable !== undefined) body['Billable'] = context.propsValue.billable;
    if (context.propsValue.sendNotification !== undefined) body['send_notification'] = context.propsValue.sendNotification;
    if (context.propsValue.relatedTo) body['Related_To'] = context.propsValue.relatedTo;
    if (context.propsValue.relatedModule) body['$related_module'] = context.propsValue.relatedModule;
    if (context.propsValue.callAgenda) body['Call_Agenda'] = context.propsValue.callAgenda;
    if (context.propsValue.dialledNumber) body['Dialled_Number'] = context.propsValue.dialledNumber;
    if (context.propsValue.tag) body['Tag'] = context.propsValue.tag;

    const response = await makeRequest(
      context.auth.access_token,
      HttpMethod.POST,
      '/Calls',
      {
        data: [body],
      }
    );

    return response.data[0];
  },
});