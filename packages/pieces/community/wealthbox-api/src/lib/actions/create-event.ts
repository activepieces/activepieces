import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const createEvent = createAction({
  name: 'create_event',
  displayName: 'Create Event',
  description: 'Creates a calendar event linked to contact',
  props: {
    // Required fields
    title: Property.ShortText({
      displayName: 'Event Title',
      description: 'The name of the event (e.g., "Client Meeting", "Portfolio Review")',
      required: true
    }),
    starts_at: Property.DateTime({
      displayName: 'Start Date & Time',
      description: 'When the event starts (YYYY-MM-DD HH:MM format)',
      required: true
    }),
    ends_at: Property.DateTime({
      displayName: 'End Date & Time',
      description: 'When the event ends (YYYY-MM-DD HH:MM format)',
      required: true
    }),
    
    // Event details
    location: Property.ShortText({
      displayName: 'Location',
      description: 'Where the event takes place (e.g., "Conference Room", "Client Office", "Video Call")',
      required: false
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'A detailed explanation of the event purpose and agenda',
      required: false
    }),
    
    // Event configuration
    all_day: Property.Checkbox({
      displayName: 'All Day Event',
      description: 'Check if this is an all-day event',
      required: false,
      defaultValue: false
    }),
    repeats: Property.Checkbox({
      displayName: 'Repeating Event',
      description: 'Check if this event repeats',
      required: false,
      defaultValue: false
    }),
    
    // Event status
    state: Property.StaticDropdown({
      displayName: 'Event Status',
      description: 'The current state of the event',
      required: false,
      defaultValue: 'unconfirmed',
      options: {
        options: [
          { label: 'Unconfirmed', value: 'unconfirmed' },
          { label: 'Confirmed', value: 'confirmed' },
          { label: 'Tentative', value: 'tentative' },
          { label: 'Completed', value: 'completed' },
          { label: 'Cancelled', value: 'cancelled' }
        ]
      }
    }),
    
    // Contact linking
    contact_id: Property.Number({
      displayName: 'Contact ID',
      description: 'The ID of the contact to link this event to',
      required: false
    }),
    contact_name: Property.ShortText({
      displayName: 'Contact Name',
      description: 'The name of the contact (for reference)',
      required: false
    }),
    
    // Invitees
    invitee_user_id: Property.Number({
      displayName: 'Invitee User ID',
      description: 'The ID of a user to invite to this event',
      required: false
    }),
    email_invitees: Property.Checkbox({
      displayName: 'Email Invitees',
      description: 'Send email invitations to invitees',
      required: false,
      defaultValue: true
    }),
    
    // Event category
    event_category: Property.Number({
      displayName: 'Event Category ID',
      description: 'The ID of the event category (optional)',
      required: false
    }),
    
    // Visibility
    visible_to: Property.StaticDropdown({
      displayName: 'Visible To',
      description: 'Who can view this event',
      required: false,
      defaultValue: 'Everyone',
      options: {
        options: [
          { label: 'Everyone', value: 'Everyone' },
          { label: 'Only Me', value: 'Only Me' },
          { label: 'My Team', value: 'My Team' }
        ]
      }
    }),
    
    // Custom fields
    custom_field_1_id: Property.Number({
      displayName: 'Custom Field 1 ID',
      description: 'ID of the first custom field to set (optional)',
      required: false
    }),
    custom_field_1_value: Property.ShortText({
      displayName: 'Custom Field 1 Value',
      description: 'Value for the first custom field',
      required: false
    }),
    custom_field_2_id: Property.Number({
      displayName: 'Custom Field 2 ID',
      description: 'ID of the second custom field to set (optional)',
      required: false
    }),
    custom_field_2_value: Property.ShortText({
      displayName: 'Custom Field 2 Value',
      description: 'Value for the second custom field',
      required: false
    })
  },
  
  async run(context) {
    const { auth, propsValue } = context;
    
    if (!auth) {
      throw new Error('Authentication is required');
    }
    
    if (!auth) {
      throw new Error('Authentication is required');
    }
    
    // Build the request body
    const requestBody: any = {
      title: propsValue.title,
      starts_at: propsValue.starts_at,
      ends_at: propsValue.ends_at
    };
    
    // Add optional fields if provided
    if (propsValue.location) requestBody.location = propsValue.location;
    if (propsValue.description) requestBody.description = propsValue.description;
    if (propsValue.all_day !== undefined) requestBody.all_day = propsValue.all_day;
    if (propsValue.repeats !== undefined) requestBody.repeats = propsValue.repeats;
    if (propsValue.state) requestBody.state = propsValue.state;
    if (propsValue.event_category) requestBody.event_category = propsValue.event_category;
    if (propsValue.visible_to) requestBody.visible_to = propsValue.visible_to;
    if (propsValue.email_invitees !== undefined) requestBody.email_invitees = propsValue.email_invitees;
    
    // Handle contact linking
    if (propsValue.contact_id) {
      requestBody.linked_to = [{
        id: propsValue.contact_id,
        type: 'Contact',
        name: propsValue.contact_name || `Contact ${propsValue.contact_id}`
      }];
    }
    
    // Handle invitees
    const invitees: any[] = [];
    
    if (propsValue.invitee_user_id) {
      invitees.push({
        id: propsValue.invitee_user_id,
        type: 'User'
      });
    }
    
    // Also add the linked contact as an invitee if specified
    if (propsValue.contact_id) {
      invitees.push({
        id: propsValue.contact_id,
        type: 'Contact'
      });
    }
    
    if (invitees.length > 0) {
      requestBody.invitees = invitees;
    }
    
    // Handle custom fields
    const customFields: any[] = [];
    
    if (propsValue.custom_field_1_id && propsValue.custom_field_1_value) {
      customFields.push({
        id: propsValue.custom_field_1_id,
        value: propsValue.custom_field_1_value
      });
    }
    
    if (propsValue.custom_field_2_id && propsValue.custom_field_2_value) {
      customFields.push({
        id: propsValue.custom_field_2_id,
        value: propsValue.custom_field_2_value
      });
    }
    
    if (customFields.length > 0) {
      requestBody.custom_fields = customFields;
    }
    
    // Make the API request
    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: 'https://api.crmworkspace.com/v1/events',
        headers: {
          'ACCESS_TOKEN': auth as string,
          'Content-Type': 'application/json'
        },
        body: requestBody
      });
      
      if (response.status >= 400) {
        throw new Error(`Wealthbox API error: ${response.status} - ${JSON.stringify(response.body)}`);
      }
      
      return response.body;
    } catch (error) {
      throw new Error(`Failed to create event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
});