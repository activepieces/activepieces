import { ActionType, AskCopilotRequest, AskCopilotResponse, assertNotNullOrUndefined, flowStructureUtil } from "@activepieces/shared"
import { anthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";
import { FastifyBaseLogger } from "fastify";
import { flowService } from "../../../flows/flow/flow.service";

export const actionAgent = (log: FastifyBaseLogger) => {
    return {
        run: async (request: AskCopilotRequest, projectId: string, stream: (response: AskCopilotResponse) => void): Promise<void> => {
            assertNotNullOrUndefined(request.selectedStep, 'Selected step is required')
            const flow = await flowService(log).getOnePopulatedOrThrow({
                id: request.flowId,
                projectId,
            })
            const flowStep = await flowStructureUtil.getStepOrThrow(request.selectedStep, flow.version.trigger)
            if (flowStep.type !== ActionType.CODE) {
                throw new Error('Selected step is not an action')
            }
            const { textStream } = streamText({
                model: anthropic('claude-3-5-sonnet-20240620'),
                maxRetries: 2,
                prompt: `
                You are Activepieces, an expert AI Assistant and exceptional workflow automation builder, You will build a code block for the workflow.

                <system_contraints>
                    - Only output the code block, no explanations or other text otherwise I will fire you.
                    - The code must have a function called code and props that is no-code friendly and easy to understand.
                    - The code block should be written in TypeScript.
                    - The code should be clean, well-documented, and follow best practices.
                    - The code should be able to be run in a javascript browser environment and compiled.
                    - Use native API and fetch API to interact with external services.
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
            });

            let code = '';
            for await (const content of textStream) {
                code += content;
                const response: AskCopilotResponse = {
                    id: request.id,
                    type: 'action',
                    code,
                    operation: {
                        name: flowStep.name,
                        displayName: flowStep.displayName,
                        type: ActionType.CODE,
                        valid: true,
                        settings: {
                            sourceCode: {
                                code,
                                packageJson: flowStep.settings.sourceCode.packageJson,
                            },
                            input: {},
                            inputUiInfo: {},
                        },
                    }
                }
                stream(response)
            }
        }
    }
}

function buildExamples() {
    const examples = [
        {
            prompt: 'Calculate the sum of the numbers',
            code: `export const code = {
                props: {
                    numbers: {
                        type: "ARRAY",
                        displayName: "Numbers", 
                        description: "",
                        required: true
                    }
                },
                run: async({ propsValue }) => {
                    const sum = propsValue.numbers.reduce((acc, num) => acc + num, 0);
                    return { sum };
                }
            };`
        },
        {
            prompt: 'Send a message to slack',
            code: `export const code = {
                props: {
                    slackToken: {
                        type: "SHORT_TEXT",
                        displayName: "Slack Token",
                        description: "Your Slack bot user OAuth token",
                        required: true
                    },
                    channel: {
                        type: "SHORT_TEXT", 
                        displayName: "Slack Channel",
                        description: "The Slack channel ID to send the message to (e.g., C12345678)",
                        required: true
                    },
                    message: {
                        type: "LONG_TEXT",
                        displayName: "Message Content", 
                        description: "The content of the Slack message",
                        required: true
                    }
                },
                run: async ({ propsValue }) => {
                    const { slackToken, channel, message } = propsValue;

                    // Send a message to Slack via HTTP POST
                    try {
                        const response = await fetch("https://slack.com/api/chat.postMessage", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "Authorization": "Bearer " + slackToken
                            },
                            body: JSON.stringify({
                                channel,
                                text: message
                            })
                        });

                        const responseData = await response.json();

                        // Check for errors in the Slack API response
                        if (!responseData.ok) {
                            throw new Error("Slack API error: " + responseData.error);
                        }

                        return responseData;
                    } catch (error) {
                        console.error("Failed to send message:", error);
                        throw new Error("Unable to send Slack message");
                    }
                }
            };`
        },
        {
            prompt: 'Send a message to discord',
            code: `export const code = {
                props: {
                    webhookUrl: {
                        type: "STRING",
                        displayName: "Webhook URL", 
                        description: "The URL of the Discord webhook to send the message to",
                        required: true
                    },
                    message: {
                        type: "STRING",
                        displayName: "Message",
                        description: "The message to send to Discord", 
                        required: true
                    }
                },
                run: async ({ propsValue }) => {
                    const response = await fetch(propsValue.webhookUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ content: propsValue.message })
                    });
                    return { status: response.status, statusText: response.statusText };
                }
            };`
        }
    ];

    return examples.map(({ prompt, code }) => `
        <example>
            <user_prompt>
                ${prompt}
            </user_prompt>
            <assistant_response>
                ${code}
            </assistant_response>
        </example>
    `).join('\n');
}