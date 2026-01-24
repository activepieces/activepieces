import { createAction, Property } from '@activepieces/pieces-framework';
import { mycaseAuth } from '../../index';
import { createMyCaseApi } from '../common/mycase-api';

export const findOrCreatePracticeArea = createAction({
  auth: mycaseAuth,
  name: 'find_or_create_practice_area',
  displayName: 'Find or Create Practice Area',
  description: 'Finds a practice area by name or creates a new one if it does not exist',
  props: {
    name: Property.ShortText({
      displayName: 'Practice Area Name',
      description: 'The name of the practice area to find or create',
      required: true,
    }),
  },
  async run(context) {
    const api = createMyCaseApi(context.auth);
    const practiceAreaName = context.propsValue.name;

    try {
      // First, try to find the practice area
      const findResponse = await api.get('/practice_areas', {
        page_size: '1000'
      });

      if (findResponse.success && Array.isArray(findResponse.data)) {
        const existingPracticeArea = findResponse.data.find(
          (pa: any) => pa.name && pa.name.toLowerCase() === practiceAreaName.toLowerCase()
        );

        if (existingPracticeArea) {
          return {
            success: true,
            practice_area: existingPracticeArea,
            created: false,
            message: `Practice area "${practiceAreaName}" found`
          };
        }
      }

      // Practice area not found, create a new one
      const requestBody = {
        name: practiceAreaName,
      };

      const createResponse = await api.post('/practice_areas', requestBody);

      if (createResponse.success) {
        return {
          success: true,
          practice_area: createResponse.data,
          created: true,
          message: `Practice area "${practiceAreaName}" created successfully`
        };
      } else {
        return {
          success: false,
          error: createResponse.error,
          details: createResponse.details
        };
      }
    } catch (error) {
      return {
        success: false,
        error: 'Failed to find or create practice area',
        details: error instanceof Error ? error.message : String(error)
      };
    }
  }
});
