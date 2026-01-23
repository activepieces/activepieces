import {
  createTrigger,
  TriggerStrategy,
} from "@activepieces/pieces-framework";
import { DIGA_API_URL, DIGA_AP_SECRET } from "../common/config";

export const callFinished = createTrigger({
  name: "callFinished",
  displayName: "Call Finished",
  description:
    "Triggers when a call ends. Assign this flow to agents in Diga to receive call data with transcription for post-processing.",
  props: {},
  sampleData: {
    call_id: "550e8400-e29b-41d4-a716-446655440000",
    status: "completed",
    duration: 180,
    end_reason: "user_hang_up",
    type: "inbound",
    created_date: "2024-01-15T10:30:00Z",
    start_time: "2024-01-15T10:30:05Z",
    end_time: "2024-01-15T10:33:05Z",
    agent_id: "660e8400-e29b-41d4-a716-446655440001",
    agent_version_id: "770e8400-e29b-41d4-a716-446655440002",
    contact_id: "880e8400-e29b-41d4-a716-446655440003",
    phone_register_id: "990e8400-e29b-41d4-a716-446655440004",
    is_test_call: false,
    recording_path: "s3://bucket/recordings/call_123.ogg",
    dynamic_variables: {
      custom_field: "value",
    },
    messages: [
      {
        id: "a10e8400-e29b-41d4-a716-446655440005",
        created_date: "2024-01-15T10:30:10Z",
        role: "USER",
        content: "Hello, I need help with my order",
        tool_call: null,
      },
      {
        id: "b20e8400-e29b-41d4-a716-446655440006",
        created_date: "2024-01-15T10:30:15Z",
        role: "ASSISTANT",
        content:
          "Of course! I'd be happy to help. Can you provide your order number?",
        tool_call: null,
      },
      {
        id: "c30e8400-e29b-41d4-a716-446655440007",
        created_date: "2024-01-15T10:30:25Z",
        role: "USER",
        content: "Yes, it's ORD-12345",
        tool_call: null,
      },
      {
        id: "d40e8400-e29b-41d4-a716-446655440008",
        created_date: "2024-01-15T10:30:30Z",
        role: "ASSISTANT",
        content:
          "Thank you! I can see your order. It was shipped yesterday and should arrive tomorrow.",
        tool_call: null,
      },
    ],
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const projectId = context.project.id;
    const flowId = context.flows.current.id;

    // Get flow name from the flows list
    const flowsPage = await context.flows.list();
    const currentFlow = flowsPage.data.find((f) => f.id === flowId);
    const flowName = currentFlow?.version?.displayName;

    const response = await fetch(
      `${DIGA_API_URL}/internal/v1/ap/triggers/call-finished`,
      {
        method: "POST",
        headers: {
          "x-ap-project-id": projectId,
          "x-ap-secret": DIGA_AP_SECRET,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          flow_id: flowId,
          webhook_url: context.webhookUrl,
          name: flowName,
        }),
      }
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Failed to register trigger: ${response.status} ${text}`);
    }

    // Store the flow_id for cleanup
    await context.store.put("flow_id", flowId);
  },
  async onDisable(context) {
    const projectId = context.project.id;
    const flowId = context.flows.current.id;

    // Wait a short delay to let Activepieces complete any deletion
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Check if the flow still exists in Activepieces
    try {
      const flowsPage = await context.flows.list();
      const flowStillExists = flowsPage.data.some((f) => f.id === flowId);

      if (!flowStillExists) {
        // Flow was truly deleted from Activepieces, delete it from Diga too
        await fetch(
          `${DIGA_API_URL}/internal/v1/ap/triggers/call-finished/${flowId}`,
          {
            method: "DELETE",
            headers: {
              "x-ap-project-id": projectId,
              "x-ap-secret": DIGA_AP_SECRET,
            },
          }
        );
        console.log(`Flow ${flowId} deleted from Diga (was deleted in Activepieces)`);
      } else {
        // Flow still exists, just disabled - don't delete to preserve relationships
        console.log(`Flow ${flowId} disabled but not deleted (preserving relationships)`);
      }
    } catch (error) {
      console.warn("Error checking flow existence:", error);
    }
  },
  async run(context) {
    return [context.payload.body];
  },
});
