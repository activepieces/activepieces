import { generateObject } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';
import { ModificationType, WorkflowModification } from '@activepieces/shared';

// Location information for actions
const ActionLocationSchema = z.object({
    parentStepName: z.string().describe('Name of the parent step where action should be added/modified'),
    locationType: z.enum(['AFTER', 'INSIDE_BRANCH', 'INSIDE_LOOP']).describe('Where relative to parent the action should be placed'),
    branchIndex: z.number().optional().describe('If inside a branch, which branch index'),
    actionName: z.string().describe('Name/identifier of the action'),
    actionType: z.enum(['code', 'piece', 'loop', 'router']).describe('Type of the action to be added'),
    actionMetadata: z.record(z.any()).describe('Any additional metadata needed to construct the action')
});

const DiffResultSchema = z.object({
    modifications: z.array(z.object({
        type: z.enum(['ADD_ACTION', 'UPDATE_ACTION', 'DELETE_ACTION', 'ADD_BRANCH', 'UPDATE_BRANCH', 'DELETE_BRANCH', 'UPDATE_TRIGGER']),
        path: z.string(),
        description: z.string(),
        location: ActionLocationSchema.optional().describe('Location information for action modifications'),
        oldValue: z.any().optional(),
        newValue: z.any().optional()
    }))
});

export type DiffResult = z.infer<typeof DiffResultSchema>;

export const diffAnalyzer = {
    analyze: async (oldWorkflow: any, newWorkflow: any): Promise<DiffResult> => {
        try {
            console.log('oldWorkflow', oldWorkflow)
            console.log('newWorkflow', newWorkflow)
            const { object } = await generateObject({
                model: anthropic('claude-3-5-sonnet-20241022', {
                    cacheControl: true,
                }),
                schema: DiffResultSchema,
                schemaName: 'WorkflowDiff',
                schemaDescription: 'Analyze differences between two workflow versions',
                prompt: `
                You are a workflow diff analyzer responsible for identifying changes between two workflow versions.

                <diff_analysis_rules>
                    - Compare the workflows step by step
                    - For ADD_ACTION modifications:
                        * Specify parentStepName (the step after which or inside which the action should be added)
                        * Specify locationType (AFTER, INSIDE_BRANCH, INSIDE_LOOP)
                        * For actions inside branches, include branchIndex
                        * Include actionName and actionType (must be one of: code, piece, loop, router)
                        * Include any relevant metadata in actionMetadata
                    - For other modifications:
                        * Identify updated or deleted actions
                        * Identify added, updated, or deleted branches
                        * Specify exact paths and provide clear descriptions
                    - If trigger changed, mark it as UPDATE_TRIGGER
                    - Focus on structural and semantic changes, not just textual differences
                </diff_analysis_rules>

                <action_type_guide>
                    - code: For code actions that run custom JavaScript/TypeScript code
                    - piece: For integration actions that connect with external services
                    - loop: For loop actions that iterate over items
                    - router: For conditional branching actions
                </action_type_guide>

                <old_workflow>
                ${JSON.stringify(oldWorkflow, null, 2)}
                </old_workflow>

                <new_workflow>
                ${JSON.stringify(newWorkflow, null, 2)}
                </new_workflow>

                Analyze the differences and provide a list of modifications with detailed location information.
                `
            });

            console.log('modifications', object)
            return object;
        
        } catch (error) {
            throw new Error('Failed to analyze workflow differences');
        }
    }
} 