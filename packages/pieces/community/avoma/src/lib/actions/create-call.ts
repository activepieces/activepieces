import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const createCall = createAction({
  name: 'create_call',
  displayName: 'Create Call',
  description: 'Creates a new call in Avoma',
  props: {
    external_id: Property.ShortText({
      displayName: 'External ID',
      description: 'Unique id of the call from the dialer system like hubspot, twilio, zoom, etc.',
      required: true
    }),
    user_email: Property.ShortText({
      displayName: 'User Email',
      description: 'Email of the user who made or received the call. This should be an Avoma user\'s email.',
      required: true
    }),
    source: Property.StaticDropdown({
      displayName: 'Source',
      description: 'Source of the call',
      required: true,
      options: {
        options: [
          { label: 'Zoom', value: 'zoom' },
          { label: 'Zoom Phone', value: 'zoomphone' },
          { label: 'Twilio', value: 'twilio' },
          { label: 'PhoneBurner', value: 'phoneburner' },
          { label: 'RingCentral', value: 'ringcentral' },
          { label: 'Aircall', value: 'aircall' },
          { label: 'HubSpot', value: 'hubspot' },
          { label: 'Other', value: 'other' }
        ]
      }
    }),
    direction: Property.StaticDropdown({
      displayName: 'Direction',
      description: 'Direction of the call',
      required: true,
      options: {
        options: [
          { label: 'Inbound', value: 'Inbound' },
          { label: 'Outbound', value: 'Outbound' }
        ]
      }
    }),
    start_at: Property.DateTime({
      displayName: 'Start Time',
      description: 'Start time of the call',
      required: true
    }),
    frm: Property.ShortText({
      displayName: 'From Phone Number',
      description: 'Phone number from which call was made (e.g., +11234567890)',
      required: true
    }),
    to: Property.ShortText({
      displayName: 'To Phone Number',
      description: 'Phone number to which call was made (e.g., +12234567890)',
      required: true
    }),
    recording_url: Property.LongText({
      displayName: 'Recording URL',
      description: 'URL of the recording of the call. This should be a public URL that Avoma can access.',
      required: true
    }),
    participants: Property.Array({
      displayName: 'Participants',
      description: 'List of participants in the call. First entry should be the prospect/lead.',
      required: true,
      properties: {
        name: Property.ShortText({
          displayName: 'Name',
          description: 'Name of the participant',
          required: true
        }),
        email: Property.ShortText({
          displayName: 'Email',
          description: 'Email of the participant',
          required: true
        }),
        crm_id: Property.ShortText({
          displayName: 'CRM Record ID',
          description: 'CRM record ID for this participant (optional)',
          required: false
        }),
        crm_type: Property.ShortText({
          displayName: 'CRM Record Type',
          description: 'Type of CRM record (e.g., contact, lead, opportunity)',
          required: false
        }),
        crm_system: Property.ShortText({
          displayName: 'CRM System',
          description: 'CRM system name (e.g., hubspot, salesforce)',
          required: false
        })
      }
    }),
    end_at: Property.DateTime({
      displayName: 'End Time',
      description: 'End time of the call',
      required: false
    }),
    frm_name: Property.ShortText({
      displayName: 'From Name',
      description: 'Name of the caller who made the call',
      required: false
    }),
    to_name: Property.ShortText({
      displayName: 'To Name',
      description: 'Name of the person to whom call was made',
      required: false
    }),
    answered: Property.Checkbox({
      displayName: 'Answered',
      description: 'Whether the call was answered',
      required: false
    }),
    is_voicemail: Property.Checkbox({
      displayName: 'Is Voicemail',
      description: 'Indicates if the call is a voicemail',
      required: false,
      defaultValue: false
    }),
    additional_details: Property.LongText({
      displayName: 'Additional Details',
      description: 'Additional details of the call (JSON object as string)',
      required: false
    })
  },
  async run(context) {
    const { auth, propsValue } = context;

    const participants = propsValue.participants?.map((participant: any) => {
      const participantData: any = {
        email: participant.email,
        name: participant.name
      };

      if (participant.crm_id && participant.crm_type && participant.crm_system) {
        participantData.associations = [{
          id: participant.crm_id,
          type: participant.crm_type,
          system: participant.crm_system
        }];
      }

      return participantData;
    }) || [];

    const requestBody: any = {
      external_id: propsValue.external_id,
      user_email: propsValue.user_email,
      source: propsValue.source,
      direction: propsValue.direction,
      start_at: propsValue.start_at,
      frm: propsValue.frm,
      to: propsValue.to,
      recording_url: propsValue.recording_url,
      participants: participants
    };

    if (propsValue.end_at) {
      requestBody.end_at = propsValue.end_at;
    }
    if (propsValue.frm_name) {
      requestBody.frm_name = propsValue.frm_name;
    }
    if (propsValue.to_name) {
      requestBody.to_name = propsValue.to_name;
    }
    if (propsValue.answered !== undefined) {
      requestBody.answered = propsValue.answered;
    }
    if (propsValue.is_voicemail !== undefined) {
      requestBody.is_voicemail = propsValue.is_voicemail;
    }
    if (propsValue.additional_details) {
      try {
        requestBody.additional_details = JSON.parse(propsValue.additional_details);
      } catch (e) {
        requestBody.additional_details = propsValue.additional_details;
      }
    }

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: 'https://api.avoma.com/v1/calls/',
        headers: {
          'Authorization': `Bearer ${auth}`,
          'Content-Type': 'application/json'
        },
        body: requestBody
      });

      if (response.status === 400) {
        const errorDetails = response.body;
        let errorMessage = 'Bad request: ';

        if (typeof errorDetails === 'object') {
          const fieldErrors = Object.entries(errorDetails)
            .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
            .join('; ');
          errorMessage += fieldErrors;
        } else {
          errorMessage += JSON.stringify(errorDetails) || 'Invalid input data';
        }

        if (errorMessage.includes('external_id') && errorMessage.includes('source')) {
          errorMessage += '. This may be due to a duplicate call (same external_id and source already exists)';
        } else if (errorMessage.includes('user_email')) {
          errorMessage += '. Check that the user exists, is active, belongs to your organization, and has dialer permissions';
        }

        throw new Error(errorMessage);
      }

      if (response.status >= 400) {
        throw new Error(`API error (${response.status}): ${JSON.stringify(response.body) || 'Unknown error'}`);
      }

      return response.body;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to create call: ${errorMessage}`);
    }
  }
});