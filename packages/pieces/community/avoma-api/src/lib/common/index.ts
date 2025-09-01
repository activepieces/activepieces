import { Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const avomaCommon = {
  meetingDropdown: Property.Dropdown({
    displayName: 'Meeting',
    description: 'Select a meeting from your Avoma account',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Please connect your Avoma account first',
          options: []
        };
      }

      try {
        const response = await httpClient.sendRequest({
          method: HttpMethod.GET,
          url: 'https://api.avoma.com/v1/meetings/?limit=100',
          headers: {
            'Authorization': `Bearer ${auth}`,
            'Content-Type': 'application/json'
          }
        });

        // Handle different possible response structures
        const meetings = response.body?.results || response.body?.data || response.body || [];
        
        if (!Array.isArray(meetings)) {
          return {
            disabled: true,
            placeholder: 'No meetings found or unexpected response format',
            options: []
          };
        }

        return {
          disabled: false,
          options: meetings.map((meeting: any) => {
            const subject = meeting.subject || meeting.title || 'Untitled Meeting';
            const startTime = meeting.start_time || meeting.startTime || meeting.created_at;
            const dateStr = startTime ? new Date(startTime).toLocaleDateString() : 'Unknown date';
            const uuid = meeting.uuid || meeting.id;
            
            return {
              label: `${subject} - ${dateStr}`,
              value: uuid
            };
          })
        };
      } catch (error) {
        console.error('Error fetching meetings:', error);
        return {
          disabled: true,
          placeholder: 'Failed to load meetings. Please check your API key.',
          options: []
        };
      }
    }
  }),

  transcriptionDropdown: Property.Dropdown({
    displayName: 'Transcription',
    description: 'Select a transcription from your Avoma meetings',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Please connect your Avoma account first',
          options: []
        };
      }

      try {
        // First get meetings, then get transcriptions for each meeting
        const meetingsResponse = await httpClient.sendRequest({
          method: HttpMethod.GET,
          url: 'https://api.avoma.com/v1/meetings/?limit=100',
          headers: {
            'Authorization': `Bearer ${auth}`,
            'Content-Type': 'application/json'
          }
        });

        const meetings = meetingsResponse.body?.results || [];
        const transcriptionOptions: { label: string; value: string }[] = [];

        // For each meeting, try to get its transcriptions
        for (const meeting of meetings.slice(0, 20)) { // Limit to first 20 meetings to avoid too many API calls
          try {
            const transcriptionResponse = await httpClient.sendRequest({
              method: HttpMethod.GET,
              url: `https://api.avoma.com/v1/meetings/${meeting.uuid}/transcriptions/`,
              headers: {
                'Authorization': `Bearer ${auth}`,
                'Content-Type': 'application/json'
              }
            });

            const transcriptions = transcriptionResponse.body?.results || [];
            transcriptions.forEach((transcription: any) => {
              transcriptionOptions.push({
                label: `${meeting.subject || 'Untitled Meeting'} - ${new Date(meeting.start_time).toLocaleDateString()}`,
                value: transcription.uuid
              });
            });
          } catch (error) {
            // Skip meetings without transcriptions
            continue;
          }
        }
        
        return {
          disabled: false,
          options: transcriptionOptions
        };
      } catch (error) {
        return {
          disabled: true,
          placeholder: 'Failed to load transcriptions. Please check your API key.',
          options: []
        };
      }
    }
  }),

  meetingUuidProperty: Property.ShortText({
    displayName: 'Meeting UUID',
    description: 'Enter the meeting UUID directly, or use the dropdown below to select from your meetings',
    required: false
  }),

  transcriptionUuidProperty: Property.ShortText({
    displayName: 'Transcription UUID',
    description: 'Enter the transcription UUID directly, or use the dropdown below to select from available transcriptions',
    required: false
  })
};