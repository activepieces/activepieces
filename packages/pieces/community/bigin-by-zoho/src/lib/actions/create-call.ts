import { createAction, Property } from '@activepieces/pieces-framework';
import { biginAuth } from '../common/auth';
import { BiginClient } from '../common/client';
import { COMMON_FIELDS, validateRequiredFields, cleanupData, formatDateTimeForBigin } from '../common/utils';

export const createCallAction = createAction({
  auth: biginAuth,
  name: 'create_call',
  displayName: 'Create Call',
  description: 'Create a new call log in Bigin CRM',
  props: {
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'Subject of the call',
      required: true
    }),
    callType: Property.StaticDropdown({
      displayName: 'Call Type',
      description: 'Type of call',
      required: false,
      options: {
        options: [
          { label: 'Outbound', value: 'Outbound' },
          { label: 'Inbound', value: 'Inbound' },
          { label: 'Missed', value: 'Missed' }
        ]
      }
    }),
    callStartTime: Property.DateTime({
      displayName: 'Call Start Time',
      description: 'When the call started',
      required: false
    }),
    callDuration: Property.ShortText({
      displayName: 'Call Duration',
      description: 'Duration of the call (in minutes)',
      required: false
    }),
    callStatus: Property.StaticDropdown({
      displayName: 'Call Status',
      description: 'Status of the call',
      required: false,
      options: {
        options: [
          { label: 'Scheduled', value: 'Scheduled' },
          { label: 'Completed', value: 'Completed' },
          { label: 'Cancelled', value: 'Cancelled' },
          { label: 'Overdue', value: 'Overdue' }
        ]
      }
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Description or notes about the call',
      required: false
    }),
    relatedTo: Property.ShortText({
      displayName: 'Related To',
      description: 'ID of the related record (Contact, Company, Deal, etc.)',
      required: false
    }),
    dialledNumber: Property.ShortText({
      displayName: 'Dialled Number',
      description: 'Phone number that was dialled',
      required: false
    }),
    callAgenda: Property.LongText({
      displayName: 'Call Agenda',
      description: 'Agenda or purpose of the call',
      required: false
    })
  },
  async run(context) {
    const {
      subject,
      callType,
      callStartTime,
      callDuration,
      callStatus,
      description,
      relatedTo,
      dialledNumber,
      callAgenda
    } = context.propsValue;

    const client = new BiginClient(context.auth);

    try {
      // Validate required fields
      validateRequiredFields({ subject }, ['subject']);

      // Build call data
      const callData = cleanupData({
        [COMMON_FIELDS.CALL.SUBJECT]: subject,
        [COMMON_FIELDS.CALL.CALL_TYPE]: callType,
        [COMMON_FIELDS.CALL.CALL_START_TIME]: callStartTime ? formatDateTimeForBigin(callStartTime) : undefined,
        [COMMON_FIELDS.CALL.CALL_DURATION]: callDuration,
        [COMMON_FIELDS.CALL.CALL_STATUS]: callStatus,
        [COMMON_FIELDS.CALL.DESCRIPTION]: description,
        [COMMON_FIELDS.CALL.RELATED_TO]: relatedTo,
        Dialled_Number: dialledNumber,
        Call_Agenda: callAgenda
      });

      // Create call
      const response = await client.createCall(callData);

      return {
        success: true,
        data: response.data?.[0] || response,
        message: 'Call created successfully'
      };
    } catch (error: any) {
      throw new Error(`Failed to create call: ${error.message}`);
    }
  }
});
