import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { biginZohoAuth } from '../../index';
import { makeRequest, BiginCall } from '../common';

export const createCall = createAction({
  auth: biginZohoAuth,
  name: 'bigin_create_call',
  displayName: 'Create Call',
  description: 'Log a new call entry in Bigin',
  props: {
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'Subject of the call',
      required: true,
    }),
    callType: Property.StaticDropdown({
      displayName: 'Call Type',
      required: false,
      options: {
        options: [
          { label: 'Inbound', value: 'Inbound' },
          { label: 'Outbound', value: 'Outbound' },
          { label: 'Missed', value: 'Missed' },
        ],
      },
    }),
    callStartTime: Property.ShortText({
      displayName: 'Call Start Time',
      description: 'Start time of the call (YYYY-MM-DD HH:MM:SS format)',
      required: false,
    }),
    callDuration: Property.ShortText({
      displayName: 'Call Duration',
      description: 'Duration of the call (e.g., "00:15:30" for 15 minutes 30 seconds)',
      required: false,
    }),
    relatedTo: Property.ShortText({
      displayName: 'Related To (What ID)',
      description: 'ID of the related record (Account, Deal, etc.)',
      required: false,
    }),
    relatedContact: Property.ShortText({
      displayName: 'Related Contact (Who ID)',
      description: 'ID of the related contact',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Call notes and description',
      required: false,
    }),
  },
  async run(context) {
    const {
      subject,
      callType,
      callStartTime,
      callDuration,
      relatedTo,
      relatedContact,
      description,
    } = context.propsValue;

    const callData: Partial<BiginCall> = {
      Subject: subject,
    };

    // Add optional fields if provided
    if (callType) callData.Call_Type = callType;
    if (callStartTime) callData.Call_Start_Time = callStartTime;
    if (callDuration) callData.Call_Duration = callDuration;
    if (relatedTo) {
      callData.What_Id = { id: relatedTo };
    }
    if (relatedContact) {
      callData.Who_Id = { id: relatedContact };
    }
    if (description) callData.Description = description;

    const requestBody = {
      data: [callData],
    };

    const response = await makeRequest(
      context.auth,
      HttpMethod.POST,
      '/Calls',
      requestBody
    );

    return response;
  },
}); 