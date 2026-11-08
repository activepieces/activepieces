import { assertWriteSucceeded } from '../common/request';
import { biginOutputSchemas } from '../common/output-schemas';
import { createAction, Property } from '@activepieces/pieces-framework';
import { biginAuth } from '../auth';
import { contactsDropdown, tagsDropdown, usersDropdown } from '../common/props';
import { biginApiService } from '../common/request';
import { formatCallDuration, formatDateTimeKeepOffset, formatDateTime, getSafeLabel, handleDropdownError } from '../common/helpers';

export const createCall = createAction({
  auth: biginAuth,
  name: 'createCall',
  classification: 'WRITE',
  displayName: 'Create Call',
  description: 'Creates a Call Log Entry Record',
  audience: 'human',
  outputSchema: biginOutputSchemas.legacyAckWithMessage,
  aiMetadata: { description: 'Logs a call in Bigin CRM with a required start time, duration in minutes, and type (Outbound, Inbound, or Missed), plus optional subject, description, agenda, reminder, dialed number, owner, contact, and a related Pipeline or Company record. Use to record a completed phone interaction; the start time must be in the past. Not idempotent: each call creates a new call log entry.', idempotent: false },
  props: {
    callStartTime: Property.DateTime({
      displayName: 'Call Start Time',
      description: 'Start time of the completed call in ISO8601 format. Must be in the past: Bigin rejects a future start time with a duration.',
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
      auth: biginAuth,
      displayName: 'Related To',
      description: 'Select the specific record the call is related to.',
      required: false,
      refreshers: ['auth', 'relatedModule'],
      options: async ({ auth, relatedModule }): Promise<any> => {
        if (!auth) return handleDropdownError('Please connect first');
        if (!relatedModule) return { options: [] };

        const { access_token, data } = auth;
        const api_domain = data['api_domain'];

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
    
      const { access_token, data } = auth;
      const api_domain = data['api_domain'];
      if (new Date(propsValue.callStartTime).getTime() > Date.now()) {
        throw new Error('Call Start Time must be in the past: this logs a completed call, and Bigin rejects a future start time with a duration.');
      }
      const payload: any = {
        Call_Start_Time: formatDateTimeKeepOffset(propsValue.callStartTime),
        Call_Duration: formatCallDuration(Number(propsValue.callDuration)),
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
        payload.Who_Id = { id: propsValue.contactName };

      const relatedTo = typeof propsValue.relatedTo === 'string' ? propsValue.relatedTo.trim() : '';
      if (relatedTo !== '' && propsValue.relatedModule) {
        const relatedModuleMap = {
          Pipelines: 'Deals',
          Companies: 'Accounts',
        };
  
        payload.$se_module =
          relatedModuleMap[
            propsValue.relatedModule as keyof typeof relatedModuleMap
          ] || 'Deals';
        payload.What_Id = { id: relatedTo };
      }
  
      if (propsValue.tag) payload.Tag = propsValue.tag.map((t: any) => ({ name: t }));

      const response = await biginApiService.createCall(
        access_token,
        api_domain,
        { data: [payload] }
      );
      
      assertWriteSucceeded(response.data?.[0]);
      return {
        message: 'Call log Entry created successfully',
        data: response.data[0],
      };
    
  },
});
