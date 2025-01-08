import { AskCopilotResponse, CopilotFlowOutline } from '@activepieces/shared';
import { taskManager } from './agents/task-manager';
import { plannerAgent } from './agents/planner';
import { diffAnalyzer } from './agents/diff-analyzer';

export const workflow = {
    handleRequest: async (id: string, prompts: string[], currentWorkflow?: CopilotFlowOutline): Promise<AskCopilotResponse> => {
        const { intent } = await taskManager.determineIntent(prompts);
        console.log('intent', prompts)
        console.log('currentWorkflow', currentWorkflow)
        if (intent === 'MODIFY_WORKFLOW') {
            if (!currentWorkflow) {
                return {
                    id,
                    type: 'error',
                    errorMessage: 'Cannot modify workflow: No existing workflow provided.',
                }
            }

            // Generate a new workflow based on the modification request
            const newWorkflowResponse = await plannerAgent.run(id, prompts);
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

            // Analyze differences between old and new workflow
            try {
                const diffResult = await diffAnalyzer.analyze(currentWorkflow, newWorkflowResponse.plan);
                return {
                    id,
                    type: 'modification',
                    modifications: diffResult.modifications
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
