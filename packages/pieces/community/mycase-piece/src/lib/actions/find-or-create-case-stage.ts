import { createAction, Property } from '@activepieces/pieces-framework';
import { mycaseAuth } from '../../index';
import { createMyCaseApi } from '../common/mycase-api';

export const findOrCreateCaseStage = createAction({
  auth: mycaseAuth,
  name: 'find_or_create_case_stage',
  displayName: 'Find or Create Case Stage',
  description: 'Finds a case stage by name or creates a new one if it does not exist',
  props: {
    name: Property.ShortText({
      displayName: 'Case Stage Name',
      description: 'The name of the case stage to find or create',
      required: true,
    }),
  },
  async run(context) {
    const api = createMyCaseApi(context.auth);
    const stageName = context.propsValue.name;

    try {
      // First, try to find the case stage
      const findResponse = await api.get('/case_stages', {
        page_size: '1000'
      });

      if (findResponse.success && Array.isArray(findResponse.data)) {
        // Search for a case stage with matching name
        const existingStage = findResponse.data.find(
          (stage: any) => stage.name && stage.name.toLowerCase() === stageName.toLowerCase()
        );

        if (existingStage) {
          return {
            success: true,
            case_stage: existingStage,
            created: false,
            message: `Case stage "${stageName}" found`
          };
        }
      }

      // Case stage not found, create a new one
      const requestBody = {
        name: stageName,
      };

      const createResponse = await api.post('/case_stages', requestBody);

      if (createResponse.success) {
        return {
          success: true,
          case_stage: createResponse.data,
          created: true,
          message: `Case stage "${stageName}" created successfully`
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
        error: 'Failed to find or create case stage',
        details: error instanceof Error ? error.message : String(error)
      };
    }
  }
});
