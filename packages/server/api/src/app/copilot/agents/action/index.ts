import { ActionType, AskCopilotRequest, AskCopilotResponse, assertNotNullOrUndefined, CopilotFlowPlanResponse, flowStructureUtil, ImportFlowRequest, UpdateActionRequest } from "@activepieces/shared"
import { anthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";
import { z } from "zod";
import { flowService } from "../../../flows/flow/flow.service";
import { FastifyBaseLogger } from "fastify";

const CodeBlock = z.object({
    code: z.string(),
    inputs: z.record(z.string(), z.string()),
})

export const actionAgent = (log: FastifyBaseLogger) => {
    return {
        run: async (request: AskCopilotRequest, projectId: string): Promise<AskCopilotResponse> => {
            assertNotNullOrUndefined(request.selectedStep, 'Selected step is required')
            const flow = await flowService(log).getOnePopulatedOrThrow({
                id: request.flowId,
                projectId,
            })
            const flowStep = await flowStructureUtil.getStepOrThrow(request.selectedStep, flow.version.trigger)
            if(flowStep.type !== ActionType.CODE) {
                throw new Error('Selected step is not an action')
            }
            const { object: generatedObject } = await generateObject({
                model: anthropic('claude-3-5-sonnet-20240620'),
                maxRetries: 2,
                prompt: `
                You are Activepieces, an expert AI Assistant and exceptional workflow automation builder, You will build a code block for the workflow.

                <system_contraints>
                    - The code must have a function called code that is async and have inputs parameters.
                    - The code block should be written in TypeScript.
                    - The code should be clean, well-documented, and follow best practices.
                    - The code should be able to be run in a javascript browser environment and compiled.
                    - Use native API and fetch API to interact with external services.
                    - Missing required inputs should be added to the parameters of the function.
                </system_contraints>

                <examples>
                    ${buildExamples()}
                </examples>

                <existing_code>
                    ${JSON.stringify({
                        code: flowStep.settings.sourceCode.code,
                        inputs: flowStep.settings.input,
                    }, null, 2)}
                </existing_code>

                <user_prompt>
                    ${request.prompts.join('\n')}
                </user_prompt>
                `,
                schema: CodeBlock,
            });

            return {
                id: request.id,
                type: 'action',
                code: generatedObject.code,
                inputs: generatedObject.inputs,
                operation: {
                    name: flowStep.name,
                    displayName: flowStep.displayName,
                    type: ActionType.CODE,
                    valid: true,
                    settings: {
                        sourceCode: {
                            code: generatedObject.code,
                            packageJson: flowStep.settings.sourceCode.packageJson,
                        },
                        input: generatedObject.inputs,
                        inputUiInfo: {},
                    },
                }
            }
        }
    }
}

function buildExamples() {
    const examples = [
        {
            prompt: 'Calculate the sum of the numbers',
            code: `export const code = async (inputs: { numbers: number[] }) => {
                const sum = inputs.numbers.reduce((acc, num) => acc + num, 0);
                return { sum };
            };`,
            inputs: { numbers: "{{ [1, 2, 3, 4, 5] }}" }
        },
        {
            prompt: 'Send a message to discord',
            code: `export const code = async (inputs: { webhookUrl: string, message: string }) => {
                const response = await fetch(inputs.webhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content: inputs.message })
                });
                return { status: response.status, statusText: response.statusText };
            };`,
            inputs: {
                webhookUrl: "{{ 'https://discord.com/api/webhooks/your-webhook-id/your-webhook-token' }}",
                message: "{{ 'Hello, Discord!' }}"
            }
        }
    ];

    return examples.map(({ prompt, code, inputs }) => `
        <example>
            <user_prompt>
                ${prompt}
            </user_prompt>
            <assistant_response>
                ${JSON.stringify({ code, inputs }, null, 2)}
            </assistant_response>
        </example>
    `).join('\n');
}