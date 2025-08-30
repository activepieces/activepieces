import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';

export const createNote = createAction({
  name: 'create_note',
  displayName: 'Create Note',
  description: 'Adds a note linked to a contact',
  props: {
    // Required field
    content: Property.LongText({
      displayName: 'Note Content',
      description: 'The main body of the note (e.g., call summary, meeting notes)',
      required: true
    }),
    
    // Contact linking
    contact_id: Property.Number({
      displayName: 'Contact ID',
      description: 'The ID of the contact to link this note to',
      required: true
    }),
    contact_name: Property.ShortText({
      displayName: 'Contact Name',
      description: 'The name of the contact (for reference, will be auto-populated from contact ID)',
      required: false
    }),
    
    // Visibility
    visible_to: Property.StaticDropdown({
      displayName: 'Visible To',
      description: 'Who can view this note',
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
    
    // Tags
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Tags to associate with the note (e.g., "Call Summary", "Meeting", "Follow-up")',
      required: false
    })
  },
  
  async run(context) {
    const { auth, propsValue } = context;
    
    if (!auth) {
      throw new Error('Authentication is required');
    }
    
    const accessToken = (auth as any).access_token;
    if (!accessToken) {
      throw new Error('Access token not found in authentication');
    }
    
    // Build the request body
    const requestBody: any = {
      content: propsValue.content,
      linked_to: [
        {
          id: propsValue.contact_id,
          type: 'Contact',
          name: propsValue.contact_name || `Contact ${propsValue.contact_id}`
        }
      ]
    };
    
    // Add optional fields if provided
    if (propsValue.visible_to) {
      requestBody.visible_to = propsValue.visible_to;
    }
    
    // Handle tags
    if (propsValue.tags && Array.isArray(propsValue.tags) && propsValue.tags.length > 0) {
      requestBody.tags = propsValue.tags;
    }
    
    // Make the API request
    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: 'https://api.crmworkspace.com/v1/notes',
        headers: {
          'ACCESS_TOKEN': context.auth as string,
          'Content-Type': 'application/json'
        },
        body: requestBody
      });
      
      if (response.status >= 400) {
        throw new Error(`Wealthbox API error: ${response.status} - ${JSON.stringify(response.body)}`);
      }
      
      return response.body;
    } catch (error) {
      throw new Error(`Failed to create note: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
});