import { AskCopilotResponse, CopilotFlowOutline } from '@activepieces/shared';
import { taskManager } from './agents/task-manager';
import { plannerAgent } from './agents/planner';
import { diffAnalyzer } from './agents/diff-analyzer';
import { operationBuilder } from './agents/diff-analyzer/operation-builder';

export const workflow = {
    handleRequest: async (id: string, prompts: string[], currentWorkflow?: CopilotFlowOutline): Promise<AskCopilotResponse> => {
        const { intent } = await taskManager.determineIntent(prompts);
        if (intent === 'MODIFY_WORKFLOW') {
            if (!currentWorkflow) {
                return {
                    id,
                    type: 'error',
                    errorMessage: 'Cannot modify workflow: No existing workflow provided.',
                }
            }

            // For modifications, only use the last prompt and pass the current workflow
            const lastPrompt = prompts[0]; 
            const newWorkflowResponse = await plannerAgent.run(id, [lastPrompt], currentWorkflow);
            if (newWorkflowResponse.type === 'error') {
                return newWorkflowResponse;
            }

            if (newWorkflowResponse.type !== 'flow') {
                return {
                    id,
                    type: 'error',
                    errorMessage: 'Failed to generate new workflow plan.',
                }
            }

            // Analyze differences and convert to operations
            try {
                const diffResult = await diffAnalyzer.analyze(currentWorkflow, newWorkflowResponse.plan);
                const operations = operationBuilder.buildOperations(diffResult);
                
                if (operations.length === 0) {
                    return {
                        id,
                        type: 'error',
                        errorMessage: 'No modifications needed.',
                    }
                }

                return {
                    id,
                    type: 'modifications',
                    plan: newWorkflowResponse.plan,
                    operations
                };
            } catch (error) {
                return {
                    id,
                    type: 'error',
                    errorMessage: 'Failed to analyze workflow modifications.',
                }
            }
        }

        return plannerAgent.run(id, prompts);
    }
}