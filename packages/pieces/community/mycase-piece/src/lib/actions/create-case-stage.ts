import { createAction, Property } from '@activepieces/pieces-framework';
import { mycaseAuth } from '../auth';
import { createMyCaseApi } from '../common/mycase-api';

export const createCaseStage = createAction({
  auth: mycaseAuth,
  name: 'create_case_stage',
  displayName: 'Create Case Stage',
  description: 'Creates a new case stage in MyCase',
  audience: 'both',
  aiMetadata: { description: 'Always inserts a new case stage with the given name, which can then be assigned to cases. Not idempotent: calling twice with the same name creates two stages, so verify the stage does not already exist before creating.', idempotent: false },
  props: {
    name: Property.ShortText({
      displayName: 'Case Stage Name',
      description: 'The name of the case stage',
      required: true,
    }),
  },
  async run(context) {
    const api = createMyCaseApi(context.auth);
    
    const requestBody = {
      name: context.propsValue.name,
    };

    try {
      const response = await api.post('/case_stages', requestBody);
      
      if (response.success) {
        return {
          success: true,
          case_stage: response.data,
          message: `Case stage "${context.propsValue.name}" created successfully`,
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
        error: 'Failed to create case stage',
        details: error instanceof Error ? error.message : String(error),
      };
    }
  },
});