import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { copyAiAuth, COPY_AI_BASE_URL } from '../../index';
import { WorkflowRunResponse } from '../common/models';

/**
 * Get Workflow Run Outputs Action
 * 
 * This action allows users to fetch the results (text, data) generated from a completed workflow run.
 * It will wait for the workflow to complete if it's still running, up to a specified timeout.
 */
export const getWorkflowRunOutputs = createAction({
  name: 'get_workflow_run_outputs',
  displayName: 'Get Workflow Run Outputs',
  description: 'Fetch the results (text, data) generated from a completed workflow run',
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
      description: 'The ID of the workflow run to get outputs from (returned when starting a workflow run)',
    }),
    
    // Optional parameters
    wait_if_not_complete: Property.Checkbox({
      displayName: 'Wait if Not Complete',
      required: false,
      defaultValue: true,
      description: 'If enabled, the action will wait until the workflow completes if it is still running',
    }),
    
    timeout_seconds: Property.Number({
      displayName: 'Timeout (seconds)',
      required: false,
      defaultValue: 60,
      description: 'Maximum time to wait for workflow completion in seconds (only used if Wait if Not Complete is enabled)',
    }),
    
    include_run_details: Property.Checkbox({
      displayName: 'Include Run Details',
      required: false,
      defaultValue: false,
      description: 'Include additional details about the workflow run (status, creation time, etc.)',
    }),
  },
  
  async run(context) {
    const {
      workflow_id,
      run_id,
      wait_if_not_complete,
      timeout_seconds,
      include_run_details,
    } = context.propsValue;
    
    try {
      // Initial check of workflow run status
      let response = await httpClient.sendRequest<WorkflowRunResponse>({
        method: HttpMethod.GET,
        url: `${COPY_AI_BASE_URL}/workflow/${workflow_id}/run/${run_id}`,
        headers: {
          'x-copy-ai-api-key': context.auth,
        },
      });
      
      let runData = response.body.data;
      
      // If the workflow is not complete and waiting is enabled, poll for completion
      if (wait_if_not_complete && runData.status !== 'COMPLETE' && runData.status !== 'FAILED') {
        const maxAttempts = Math.max(1, Math.floor((timeout_seconds || 60) / 2));
        let attempts = 0;
        
        while (attempts < maxAttempts && runData.status !== 'COMPLETE' && runData.status !== 'FAILED') {
          attempts++;
          
          // Wait 2 seconds between polls
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Check run status again
          response = await httpClient.sendRequest<WorkflowRunResponse>({
            method: HttpMethod.GET,
            url: `${COPY_AI_BASE_URL}/workflow/${workflow_id}/run/${run_id}`,
            headers: {
              'x-copy-ai-api-key': context.auth,
            },
          });
          
          runData = response.body.data;
        }
      }
      
      // Check if the workflow is complete
      if (runData.status !== 'COMPLETE') {
        if (runData.status === 'FAILED') {
          throw new Error(`Workflow run failed: ${JSON.stringify(runData)}`);
        } else {
          throw new Error(`Workflow run is not complete (current status: ${runData.status}). Try again later or increase the timeout.`);
        }
      }
      
      // Return the outputs
      if (include_run_details) {
        return {
          outputs: runData.output || {},
          run_details: {
            run_id: run_id,
            status: runData.status,
            created_at: runData.createdAt,
            input: runData.input,
            metadata: runData.metadata,
            credits: runData.credits,
          },
        };
      } else {
        return runData.output || {};
      }
      
    } catch (error) {
      // Provide helpful error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get workflow run outputs: ${errorMessage}`);
    }
  },
});
