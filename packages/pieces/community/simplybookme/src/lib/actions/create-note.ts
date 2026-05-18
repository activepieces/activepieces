import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { simplybookAuth, getAccessToken, SimplybookAuth, serviceDropdown, providerDropdown, noteTypeDropdown } from '../common';

export const createNote = createAction({
  auth: simplybookAuth,
  name: 'create_note',
  displayName: 'Create Note',
  description: 'Create a note (generic) in the system',
  props: {
    startDateTime: Property.ShortText({
      displayName: 'Start Date Time',
      description: 'Note start date and time (format: YYYY-MM-DD HH:MM:SS)',
      required: true
    }),
    endDateTime: Property.ShortText({
      displayName: 'End Date Time',
      description: 'Note end date and time (format: YYYY-MM-DD HH:MM:SS)',
      required: true
    }),
    noteTypeId: noteTypeDropdown,
    note: Property.LongText({
      displayName: 'Note',
      description: 'Note body/content',
      required: true
    }),
    mode: Property.StaticDropdown({
      displayName: 'Mode',
      description: 'Note mode - determines visibility scope',
      required: true,
      options: {
        options: [
          { label: 'Service', value: 'service' },
          { label: 'Provider', value: 'provider' },
          { label: 'All', value: 'all' }
        ]
      }
    }),
    timeBlocked: Property.Checkbox({
      displayName: 'Time Blocked',
      description: 'Whether the time should be blocked',
      required: false,
      defaultValue: true
    }),
    providerId: Property.Dropdown({
      auth: simplybookAuth,
      displayName: 'Provider',
      description: 'Select a provider (optional)',
      required: false,
      refreshers: [],
      options: providerDropdown.options
    }),
    serviceId: Property.Dropdown({
      auth: simplybookAuth,
      displayName: 'Service',
      description: 'Select a service (optional)',
      required: false,
      refreshers: [],
      options: serviceDropdown.options
    })
  },
  async run(context) {
    const auth = context.auth.props;
    const accessToken = await getAccessToken(auth);

    const noteData: any = {
      start_date_time: context.propsValue.startDateTime,
      end_date_time: context.propsValue.endDateTime,
      note_type_id: context.propsValue.noteTypeId.toString(),
      note: context.propsValue.note,
      mode: context.propsValue.mode,
      time_blocked: context.propsValue.timeBlocked ?? true
    };

    // Add optional fields
    if (context.propsValue.providerId) {
      noteData.provider_id = context.propsValue.providerId;
    }
    if (context.propsValue.serviceId) {
      noteData.service_id = context.propsValue.serviceId;
    }

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: 'https://user-api-v2.simplybook.me/admin/calendar-notes',
        headers: {
          'Content-Type': 'application/json',
          'X-Company-Login': auth.companyLogin,
          'X-Token': accessToken
        },
        body: noteData
      });

      return response.body;
    } catch (error: any) {
      if (error.response) {
        throw new Error(
          `Failed to create note: ${error.response.status} - ${JSON.stringify(error.response.body)}`
        );
      }
      throw new Error(`Failed to create note: ${error.message}`);
    }
  }
});
