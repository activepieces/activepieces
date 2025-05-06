import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';

const markdown = `
To set up the Copy.ai webhook trigger, follow these steps:

1. You can register webhook endpoints via the Copy.ai API to be notified about workflow events that happen in your workspace.
2. Send a POST request to https://api.copy.ai/api/webhook.
3. Payload will be a JSON object with the following properties:
    - url: Activepieces webhook endpoint.
    - event: Sends an event anytime a workflow run is completed.
4. You can find the Activepieces webhook endpoint in the Activepieces dashboard.
`;

export const workflowRunCompleted = createTrigger({
    name: 'workflow_run_completed',
    displayName: 'Workflow Run Completed',
    description: 'Triggered when a workflow run is completed in Copy.ai',
    props: {
        md: Property.MarkDown({
            value: markdown,
        }),
    },
    type: TriggerStrategy.WEBHOOK,
    sampleData: {
        method:"POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: {
            status: "COMPLETE",
            input: {
                "text": "Sample text from Copy.ai"
            },
            output: {
                "final_output": "Some text from Copy.ai",
                "send_api_request": "Another text from Copy.ai"
            },
            type:"workflowRun.completed"
        },
    },
    async onEnable(context) {
        // The webhook URL will be displayed in the UI via Markdown
    },
    async onDisable(context) {
        // No action needed, the webhook can be manually removed from Copy.ai's dashboard
    },
    async run(context) {
        return [context.payload];
    },
});
