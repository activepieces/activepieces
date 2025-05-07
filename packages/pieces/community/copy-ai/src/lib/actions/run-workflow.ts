import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { copyAiAuth, COPY_AI_BASE_URL } from '../../index';
import { StartWorkflowRunResponse } from '../common/models';

/**
 * Run Workflow Action
 * 
 * This action allows users to start a predefined workflow in Copy.ai by submitting inputs
 * and receiving the workflow run ID for tracking.
 */
export const runWorkflow = createAction({
  name: 'run_workflow',
  displayName: 'Run Workflow',
  description: 'Start a predefined workflow by submitting inputs and receive a run ID to track progress',
  auth: copyAiAuth,
  
  props: {
    // Core parameters
    workflow_id: Property.ShortText({
      displayName: 'Workflow ID',
      required: true,
      description: 'The ID of the workflow to run (found in the workflow URL or API tab)',
    }),
    
    // Dynamic inputs
    start_variables: Property.Object({
      displayName: 'Input Variables',
      required: true,
      description: 'The input variables for the workflow (these vary depending on the workflow)',
    }),
    
    // Optional metadata
    metadata: Property.Object({
      displayName: 'Metadata',
      required: false,
      description: 'Optional metadata to attach to this workflow run (will be included in webhook notifications)',
    }),
    
    // Wait for completion option
    wait_for_completion: Property.Checkbox({
      displayName: 'Wait for Completion',
      required: false,
      defaultValue: false,
      description: 'If enabled, the action will wait until the workflow completes and return the results',
    }),
    
    // Timeout in seconds (only used if wait_for_completion is true)
    timeout_seconds: Property.Number({
      displayName: 'Timeout (seconds)',
      required: false,
      defaultValue: 60,
      description: 'Maximum time to wait for workflow completion in seconds (only used if Wait for Completion is enabled)',
    }),
  },
  
  async run(context) {
    const {
      workflow_id,
      start_variables,
      metadata,
      wait_for_completion,
      timeout_seconds,
    } = context.propsValue;
    
    // Prepare request body
    const requestBody: Record<string, any> = {
      startVariables: start_variables,
    };
    
    // Add metadata if provided
    if (metadata) {
      requestBody.metadata = metadata;
    }
    
    try {
      // Start the workflow run
      const response = await httpClient.sendRequest<StartWorkflowRunResponse>({
        method: HttpMethod.POST,
        url: `${COPY_AI_BASE_URL}/workflow/${workflow_id}/run`,
        headers: {
          'Content-Type': 'application/json',
          'x-copy-ai-api-key': context.auth,
        },
        body: requestBody,
      });
      
      // If not waiting for completion, return the run ID
      if (!wait_for_completion) {
        return {
          run_id: response.body.data.id,
          status: 'started',
          message: 'Workflow run started successfully. Use the Get Workflow Run Status action to check progress.',
        };
      }
      
      // Wait for completion
      const runId = response.body.data.id;
      const maxAttempts = Math.max(1, Math.floor((timeout_seconds || 60) / 2));
      let attempts = 0;
      
      // Poll for completion
      while (attempts < maxAttempts) {
        attempts++;
        
        // Wait 2 seconds between polls
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check run status
        const statusResponse = await httpClient.sendRequest({
          method: HttpMethod.GET,
          url: `${COPY_AI_BASE_URL}/workflow/${workflow_id}/run/${runId}`,
          headers: {
            'x-copy-ai-api-key': context.auth,
          },
        });
        
        const runStatus = statusResponse.body.data.status;
        
        // Return if complete or failed
        if (runStatus === 'COMPLETE') {
          return {
            run_id: runId,
            status: runStatus,
            output: statusResponse.body.data.output,
            input: statusResponse.body.data.input,
            metadata: statusResponse.body.data.metadata,
            credits: statusResponse.body.data.credits,
          };
        }
        
        if (runStatus === 'FAILED') {
          throw new Error(`Workflow run failed: ${JSON.stringify(statusResponse.body.data)}`);
        }
      }
      
      // Timeout reached
      return {
        run_id: runId,
        status: 'timeout',
        message: `Workflow is still running but timeout of ${timeout_seconds} seconds was reached. Use the Get Workflow Run Status action to check progress.`,
      };
      
    } catch (error) {
      // Provide helpful error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to run workflow: ${errorMessage}`);
    }
  },
});
