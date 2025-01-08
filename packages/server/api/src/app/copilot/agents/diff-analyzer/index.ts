import { generateObject } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';
import { ModificationType, WorkflowModification } from '@activepieces/shared';

const DiffResultSchema = z.object({
    modifications: z.array(WorkflowModification)
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
                    - Identify added, updated, or deleted actions
                    - Identify added, updated, or deleted branches
                    - For each change, specify the exact path and provide clear description
                    - If trigger changed, mark it as UPDATE_TRIGGER
                    - Focus on structural and semantic changes, not just textual differences
                </diff_analysis_rules>

                <old_workflow>
                ${JSON.stringify(oldWorkflow, null, 2)}
                </old_workflow>

                <new_workflow>
                ${JSON.stringify(newWorkflow, null, 2)}
                </new_workflow>

                Analyze the differences and provide a list of modifications.
                `
            });

            return object;
        } catch (error) {
            throw new Error('Failed to analyze workflow differences');
        }
    }
} 