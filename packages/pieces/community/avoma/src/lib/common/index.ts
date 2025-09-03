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
        const toDate = new Date().toISOString();
        const fromDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

        const response = await httpClient.sendRequest({
          method: HttpMethod.GET,
          url: `https://api.avoma.com/v1/meetings/?page_size=100&from_date=${encodeURIComponent(fromDate)}&to_date=${encodeURIComponent(toDate)}`,
          headers: {
            'Authorization': `Bearer ${auth}`,
            'Content-Type': 'application/json'
          }
        });

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
        const toDate = new Date().toISOString();
        const fromDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

        const response = await httpClient.sendRequest({
          method: HttpMethod.GET,
          url: `https://api.avoma.com/v1/transcriptions/?page_size=100&from_date=${encodeURIComponent(fromDate)}&to_date=${encodeURIComponent(toDate)}`,
          headers: {
            'Authorization': `Bearer ${auth}`,
            'Content-Type': 'application/json'
          }
        });

        let transcriptions = [];
        if (response.body?.results) {
          transcriptions = response.body.results;
        } else if (Array.isArray(response.body)) {
          transcriptions = response.body;
        } else if (response.body && typeof response.body === 'object') {
          transcriptions = [response.body];
        }

        if (!Array.isArray(transcriptions)) {
          return {
            disabled: true,
            placeholder: 'Unexpected response format from API',
            options: []
          };
        }

        return {
          disabled: false,
          options: transcriptions.map((transcription: any) => {
            const meetingUuid = transcription.meeting_uuid || 'Unknown Meeting';
            const transcriptionUuid = transcription.uuid;
            const speakersCount = transcription.speakers?.length || 0;
            const transcriptLength = transcription.transcript?.length || 0;

            return {
              label: `Transcription ${transcriptionUuid.substring(0, 8)}... - ${speakersCount} speakers, ${transcriptLength} paragraphs`,
              value: transcriptionUuid
            };
          })
        };
      } catch (error) {
        console.error('Error fetching transcriptions:', error);
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