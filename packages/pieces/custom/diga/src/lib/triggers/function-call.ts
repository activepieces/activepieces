import {
  createTrigger,
  Property,
  TriggerStrategy,
} from "@activepieces/pieces-framework";

// Diga backend API URL
// TODO: Configure this for your environment
const DIGA_API_URL = "http://localhost:3000";

export const functionCall = createTrigger({
  name: "functionCall",
  displayName: "Function Call",
  description:
    "Se activa cuando el agente de voz llama esta función durante la conversación. " +
    "Define cuándo debe llamarse y qué parámetros extraer.",
  props: {
    function_description: Property.LongText({
      displayName: "Cuándo llamar",
      description:
        "Describe cuándo debe el agente llamar esta función. Sé específico sobre el contexto " +
        "e intención del usuario (ej: 'Cuando el usuario quiera agendar una cita').",
      required: true,
    }),
    parameters_schema: Property.Json({
      displayName: "Parámetros (JSON Schema)",
      description:
        "JSON Schema que define los parámetros que la IA debe extraer de la conversación. " +
        'Ejemplo: {"type":"object","properties":{"fecha":{"type":"string","description":"Fecha de la cita"},' +
        '"hora":{"type":"string","description":"Hora preferida"}},"required":["fecha"]}',
      required: false,
      defaultValue: {
        type: "object",
        properties: {},
        required: [],
      },
    }),
  },
  sampleData: {
    call_id: "550e8400-e29b-41d4-a716-446655440000",
    function_name: "agendar_cita",
    arguments: {
      fecha: "2024-01-20",
      hora: "10:00",
      servicio: "consulta",
    },
    agent_id: "660e8400-e29b-41d4-a716-446655440001",
    agent_version_id: "770e8400-e29b-41d4-a716-446655440002",
    contact_id: "880e8400-e29b-41d4-a716-446655440003",
    timestamp: "2024-01-15T10:30:25Z",
    dynamic_variables: {
      custom_field: "value",
    },
  },
  type: TriggerStrategy.WEBHOOK,

  async onEnable(context) {
    const projectId = context.project.id;
    const flowId = context.flows.current.id;

    // Get flow name from the flows list
    const flowsPage = await context.flows.list();
    const currentFlow = flowsPage.data.find((f) => f.id === flowId);
    const flowName = currentFlow?.version?.displayName;

    // Function name = flow name in snake_case, or fallback to flow ID prefix
    const functionName =
      flowName?.toLowerCase().replace(/\s+/g, "_") ||
      `function_${flowId.slice(0, 8)}`;

    const response = await fetch(
      `${DIGA_API_URL}/internal/v1/ap/triggers/function-call`,
      {
        method: "POST",
        headers: {
          "x-ap-project-id": projectId,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          flow_id: flowId,
          webhook_url: context.webhookUrl,
          name: flowName,
          function_name: functionName,
          function_description: context.propsValue.function_description,
          parameters_schema: context.propsValue.parameters_schema,
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
    const flowId = await context.store.get<string>("flow_id");

    if (flowId) {
      try {
        await fetch(
          `${DIGA_API_URL}/internal/v1/ap/triggers/function-call/${flowId}`,
          {
            method: "DELETE",
            headers: {
              "x-ap-project-id": projectId,
            },
          }
        );
      } catch (error) {
        // Ignore errors during cleanup
        console.warn("Failed to unregister trigger:", error);
      }
    }
  },

  async run(context) {
    return [context.payload.body];
  },
});
