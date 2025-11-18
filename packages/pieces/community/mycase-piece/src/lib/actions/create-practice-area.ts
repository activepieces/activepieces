import { createAction, Property } from '@activepieces/pieces-framework';
import { mycaseAuth } from '../../index';
import { createMyCaseApi } from '../common/mycase-api';

export const createPracticeArea = createAction({
  auth: mycaseAuth,
  name: 'create_practice_area',
  displayName: 'Create Practice Area',
  description: 'Creates a new practice area in MyCase',
  props: {
    name: Property.ShortText({
      displayName: 'Practice Area Name',
      description: 'The name of the practice area',
      required: true,
    }),
  },
  async run(context) {
    const api = createMyCaseApi(context.auth);
    
    const requestBody = {
      name: context.propsValue.name,
    };

    try {
      const response = await api.post('/practice_areas', requestBody);
      
      if (response.success) {
        return {
          success: true,
          practice_area: response.data,
          message: `Practice area "${context.propsValue.name}" created successfully`,
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
        error: 'Failed to create practice area',
        details: error instanceof Error ? error.message : String(error),
      };
    }
  },
});