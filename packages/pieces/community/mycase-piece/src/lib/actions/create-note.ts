import { createAction, Property } from '@activepieces/pieces-framework';
import { mycaseAuth } from '../../index';
import { createMyCaseApi } from '../common/mycase-api';

export const createNote = createAction({
  auth: mycaseAuth,
  name: 'create_note',
  displayName: 'Create Note',
  description: 'Creates a new note for a specified case in MyCase',
  props: {
    case_id: Property.Number({
      displayName: 'Case ID',
      description: 'The ID of the case to create the note for',
      required: true,
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'Subject of the note',
      required: true,
    }),
    note: Property.LongText({
      displayName: 'Note',
      description: 'The body text of the note',
      required: true,
    }),
    date: Property.ShortText({
      displayName: 'Date',
      description: 'The date of the note in ISO 8601 format (e.g., 2024-01-15T10:00:00Z)',
      required: true,
    }),
  },
  async run(context) {
    const api = createMyCaseApi(context.auth);
    
    // Build the request body
    const requestBody = {
      subject: context.propsValue.subject,
      note: context.propsValue.note,
      date: context.propsValue.date,
    };

    try {
      const response = await api.post(`/cases/${context.propsValue.case_id}/notes`, requestBody);
      
      if (response.success) {
        return {
          success: true,
          note: response.data,
          message: `Note "${context.propsValue.subject}" created successfully for case ${context.propsValue.case_id}`,
        };
      } else {
        return {
          success: false,
          error: response.error,
          details: response.details,
        };
      }
    } catch (error) {
      return {
        success: false,
        error: 'Failed to create note',
        details: error instanceof Error ? error.message : String(error),
      };
    }
  },
});