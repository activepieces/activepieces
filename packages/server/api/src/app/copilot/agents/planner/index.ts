import { generateObject } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { AskCopilotResponse, CopilotFlowPlanResponse, isNil } from '@activepieces/shared';
import { plannerUtils } from './planner-utils';

export const plannerAgent = {
    run: async (id: string, prompts: string[]): Promise<AskCopilotResponse> => {
        const { object } = await generateObject({
            model: anthropic('claude-3-5-sonnet-20241022'),
            schema: CopilotFlowPlanResponse,
            prompt: `
            You are Activepieces, an expert AI Assistant and exceptional workflow automation builder.

            <system_constraints>
                - You can only generate workflows, you cannot generate user interfaces
                - The workflow must start with a trigger event that initiates the automation
                - Each workflow step should be an independent, reusable function
                - The workflow steps should be clear and high-level, without implementation details
                - Focus on describing what each step accomplishes, not how it works internally
                - The workflow must have single trigger, If the user wants to add multiple triggers, inform them they can't do that.
                - Keep steps focused and consolidated for the business output - combine data preparation with related actions rather than creating separate steps
            </system_constraints>

            <examples>
                ${WORKFLOW_EXAMPLES.map(example => `
                    <example>
                        <user_prompt>${example.prompt}</user_prompt>
                        <assistant_response>${JSON.stringify(example.response, null, 4)}</assistant_response>
                    </example>
                `).join('\n')}
            </examples>

            <user_prompt>
                ${prompts.join('\n')}
            </user_prompt>
            `,
        });

        const workflow = object.workflow;
        if(isNil(workflow)) {
            return {
                id,
                type: 'error',
                errorMessage: object.errorMessage ?? 'I could not generate the workflow, please try again',
            }
        }
        return {
            id,
            type: 'flow',
            plan: workflow,
            operation: await plannerUtils.buildWorkflow(workflow),
        }
    }
}


const WORKFLOW_EXAMPLES: { prompt: string, response: CopilotFlowPlanResponse }[] = [
    {
        prompt: "Send an email to the user when they sign up",
        response: {
            workflow: {
                name: "Send an email to the user when they sign up",
                description: "This workflow sends an email to the user when they sign up.",
                trigger: {
                    title: "User Signup",
                    description: "When a user signs up"
                },
                steps: [
                    {
                        type: "action",
                        title: "Send Welcome Email",
                        description: "Send an email to the user"
                    }
                ]
            }
        }
    },
    {
        prompt: "Create a task in Trello when I receive a Gmail",
        response: {
            workflow: {
                name: "Gmail to Trello Task Creator",
                description: "Creates a new Trello card whenever a new email is received in Gmail.",
                trigger: {
                    title: "New Gmail",
                    description: "When a new email is received in Gmail"
                },
                steps: [
                    {
                        type: "action",
                        title: "Create Trello Card",
                        description: "Create a new card in Trello with email content"
                    }
                ]
            }
        }
    },
    {
        prompt: "Post to Twitter when there's a new YouTube video",
        response: {
            workflow: {
                name: "YouTube to Twitter Auto-Poster",
                description: "Automatically posts a tweet when a new video is uploaded to a YouTube channel.",
                trigger: {
                    title: "New YouTube Video",
                    description: "When a new YouTube video is uploaded"
                },
                steps: [
                    {
                        type: "action",
                        title: "Post Tweet",
                        description: "Create and post a tweet with video information"
                    }
                ]
            }
        }
    },
    {
        prompt: "Monitor a website for job updates and send them to Telegram",
        response: {
            workflow: {
                name: "Website Job Updates to Telegram",
                description: "Monitors a website for new job updates and sends the details to a Telegram bot.",
                trigger: {
                    title: "Website Update",
                    description: "When a new job update is posted on the website"
                },
                steps: [
                    {
                        type: "action",
                        title: "Send Telegram Message",
                        description: "Send the job details to a Telegram bot"
                    }
                ]
            }
        }
    },
    {
        prompt: "send a slack message 'we did it' whenever i get a shopify order over $100",
        response: {
            workflow: {
                name: "High Value Shopify Order Slack Notification",
                description: "Sends a Slack message when a Shopify order exceeds $100.",
                trigger: {
                    title: "New Shopify Order",
                    description: "When a new order is created in Shopify"
                },
                steps: [
                    {
                        type: "router",
                        title: "Check Order Value",
                        description: "Check if the order total is greater than $100",
                        branches: [
                            {
                                condition: "Order total > $100",
                                steps: [
                                    {
                                        type: "action",
                                        title: "Send Slack Message",
                                        description: "Send 'we did it' message to Slack channel"
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        }
    }
];
