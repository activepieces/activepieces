import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { copyAiAuth, COPY_AI_BASE_URL } from '../../index';
import { WorkflowRunResponse } from '../common/models';

/**
 * Get Workflow Run Status Action
 * 
 * This action allows users to check the current status of a workflow run
 * to determine if it's still running, completed, or failed.
 */
export const getWorkflowRunStatus = createAction({
  name: 'get_workflow_run_status',
  displayName: 'Get Workflow Run Status',
  description: 'Check if a workflow is still running, completed, or failed',
  auth: copyAiAuth,
  
  props: {
    // Required parameters
    workflow_id: Property.ShortText({
      displayName: 'Workflow ID',
      required: true,
      description: 'The ID of the workflow (found in the workflow URL or API tab)',
    }),
    
    run_id: Property.ShortText({
      displayName: 'Run ID',
      required: true,
      description: 'The ID of the workflow run to check (returned when starting a workflow run)',
    }),
    
    // Optional parameters
    include_inputs: Property.Checkbox({
      displayName: 'Include Input Values',
      required: false,
      defaultValue: false,
      description: 'Include the input values that were used to start the workflow run',
    }),
    
    include_outputs: Property.Checkbox({
      displayName: 'Include Output Values',
      required: false,
      defaultValue: false,
      description: 'Include the output values if the workflow run is complete',
    }),
  },
  
  async run(context) {
    const {
      workflow_id,
      run_id,
      include_inputs,
      include_outputs,
    } = context.propsValue;
    
    try {
      // Get workflow run status
      const response = await httpClient.sendRequest<WorkflowRunResponse>({
        method: HttpMethod.GET,
        url: `${COPY_AI_BASE_URL}/workflow/${workflow_id}/run/${run_id}`,
        headers: {
          'x-copy-ai-api-key': context.auth,
        },
      });
      
      // Extract the run data
      const runData = response.body.data;
      
      // Build the response based on user preferences
      const result: Record<string, any> = {
        run_id: run_id,
        status: runData.status,
        created_at: runData.createdAt,
      };
      
      // Include metadata if available
      if (runData.metadata) {
        result.metadata = runData.metadata;
      }
      
      // Include credits if available
      if (runData.credits !== undefined) {
        result.credits = runData.credits;
      }
      
      // Include inputs if requested
      if (include_inputs && runData.input) {
        result.input = runData.input;
      }
      
      // Include outputs if requested and available
      if (include_outputs && runData.output) {
        result.output = runData.output;
      }
      
      // Add a human-readable status message
      switch (runData.status) {
        case 'NEW':
          result.status_message = 'The workflow run has just been created and is ready to be processed.';
          break;
        case 'WAITING':
          result.status_message = 'The workflow run is waiting for required resources or conditions to be met.';
          break;
        case 'PROCESSING':
          result.status_message = 'The workflow run is currently being executed.';
          break;
        case 'COMPLETE':
          result.status_message = 'The workflow run has successfully completed.';
          break;
        case 'RETRYING':
          result.status_message = 'The workflow run encountered an issue and is retrying the failed step(s).';
          break;
        case 'FAILED':
          result.status_message = 'The workflow run has failed to complete due to an error.';
          break;
        default:
          result.status_message = `Unknown status: ${runData.status}`;
      }
      
      return result;
      
    } catch (error) {
      // Provide helpful error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get workflow run status: ${errorMessage}`);
    }
  },
});
