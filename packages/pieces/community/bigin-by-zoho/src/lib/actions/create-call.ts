import { createAction, Property } from '@activepieces/pieces-framework';
import { biginAuth } from '../../index';
import { contactsDropdown, tagsDropdown, usersDropdown } from '../common/props';
import { biginApiService } from '../common/request';
import { formatDateTime, getSafeLabel, handleDropdownError } from '../common/helpers';

export const createCall = createAction({
  auth: biginAuth,
  name: 'createCall',
  displayName: 'Create Call',
  description: 'Creates a Call Log Entry Record',
  props: {
    callStartTime: Property.DateTime({
      displayName: 'Call Start Time',
      description: 'Provide the start time of the call in ISO8601 format.',
      required: true,
    }),
    callDuration: Property.Number({
      displayName: 'Call Duration (minutes)',
      description:
        'Provide the duration of the call in minutes (numeric). For example, 30 for a 30-minute call.',
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
    owner: usersDropdown,
    contactName: contactsDropdown,
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
      displayName: 'Dialed Number',
      description: 'Provide the number dialed for the call.',
      required: false,
    }),
    relatedModule: Property.StaticDropdown({
      displayName: 'Related Module',
      description: 'Select the type of entity the call is related to.',
      required: false,
      defaultValue: 'Pipelines',
      options: {
        options: [
          { label: 'Pipelines', value: 'Pipelines' },
          { label: 'Companies', value: 'Companies' },
        ],
      },
    }),
    relatedTo: Property.Dropdown({
      displayName: 'Related To',
      description: 'Select the specific record the call is related to.',
      required: false,
      refreshers: ['auth', 'relatedModule'],
      defaultValue: {},
      options: async ({ auth, relatedModule }): Promise<any> => {
        if (!auth) return handleDropdownError('Please connect first');
        if (!relatedModule) return { options: [] };

        const { access_token, api_domain } = auth as any;

        const fetchMap: Record<string, () => Promise<any>> = {
          Pipelines: () =>
            biginApiService.fetchPipelinesRecords(access_token, api_domain),
          Companies: () =>
            biginApiService.fetchCompanies(access_token, api_domain),
        };

        const fetchFn = fetchMap[relatedModule as keyof typeof fetchMap];

        const response = await fetchFn();

        const records = response?.data || [];

        return {
          options: records.map((item: any) => ({
            label: getSafeLabel(item),
            value: item.id,
          })),
        };
      },
    }),
    tag: tagsDropdown('Calls'),
  },
  async run({ auth, propsValue }) {
    try {
      const { access_token, api_domain } = auth as any;

      const payload: any = {
        Call_Start_Time: formatDateTime(propsValue.callStartTime),
        Call_Duration: Number(propsValue.callDuration),
        Call_Type: propsValue.callType,
      };
  
      if (propsValue.subject) payload.Subject = propsValue.subject;
      if (propsValue.description) payload.Description = propsValue.description;
      if (propsValue.callAgenda) payload.Call_Agenda = propsValue.callAgenda;
      if (propsValue.reminder) payload.Reminder = formatDateTime(propsValue.reminder);
      if (propsValue.dialledNumber)
        payload.Dialled_Number = propsValue.dialledNumber;
      if (propsValue.owner) payload.Owner = { id: propsValue.owner };
      if (propsValue.contactName)
        payload.Contact_Name = { id: propsValue.contactName };

      if (propsValue.relatedTo && propsValue.relatedModule) {
        const relatedModuleMap = {
          Pipelines: 'Deals',
          Companies: 'Accounts',
        };
  
        payload.$related_module =
          relatedModuleMap[
            propsValue.relatedModule as keyof typeof relatedModuleMap
          ] || 'Deals';
        payload.Related_To = { id: propsValue.relatedTo };
      }
  
      if (propsValue.tag) payload.Tag = propsValue.tag.map((t: any) => ({ name: t }));

      const response = await biginApiService.createCall(
        access_token,
        api_domain,
        { data: [payload] }
      );
      
      return {
        message: 'Call log Entry created successfully',
        data: response.data[0],
      };
    } catch (error: any) {
      console.error('Error creating call log entry:', error);
      throw new Error(
        error instanceof Error
          ? `Failed to create call log entry: ${error.message}`
          : 'Failed to create call log entry due to an unknown error'
      );
    }
  },
});
