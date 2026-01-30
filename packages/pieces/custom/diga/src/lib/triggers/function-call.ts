import {
  createTrigger,
  Property,
  TriggerStrategy,
} from "@activepieces/pieces-framework";
import { DIGA_API_URL, DIGA_AP_SECRET } from "../common/config";

// Type for parameter definition from the form
type ParameterDefinition = {
  name: string;
  dataType: "string" | "number" | "boolean" | "array";
  required: boolean;
  description?: string;
  itemsType?: "string" | "number" | "boolean";
};

// Convert form parameters to JSON Schema format
function parametersToJsonSchema(parameters: ParameterDefinition[]): {
  type: "object";
  properties: Record<
    string,
    { type: string; description?: string; items?: { type: string } }
  >;
  required: string[];
} {
  const properties: Record<
    string,
    { type: string; description?: string; items?: { type: string } }
  > = {};
  const required: string[] = [];

  for (const param of parameters) {
    if (param.dataType === "array") {
      properties[param.name] = {
        type: "array",
        items: { type: param.itemsType || "string" },
      };
    } else {
      properties[param.name] = {
        type: param.dataType,
      };
    }
    if (param.description) {
      properties[param.name].description = param.description;
    }
    if (param.required) {
      required.push(param.name);
    }
  }

  return {
    type: "object",
    properties,
    required,
  };
}

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
    parameters: Property.Array({
      displayName: "Parámetros",
      description:
        "Define los parámetros que la IA debe extraer de la conversación.",
      required: false,
      properties: {
        name: Property.ShortText({
          displayName: "Nombre del parámetro",
          description:
            "Identificador único para este parámetro (ej: fecha, nombre, email).",
          required: true,
        }),
        dataType: Property.StaticDropdown({
          displayName: "Tipo de dato",
          description: "El tipo de dato que acepta este parámetro.",
          required: true,
          defaultValue: "string",
          options: {
            disabled: false,
            options: [
              { label: "Texto", value: "string" },
              { label: "Número", value: "number" },
              { label: "Booleano", value: "boolean" },
              { label: "Array", value: "array" },
            ],
          },
        }),
        itemsType: Property.StaticDropdown({
          displayName: "Tipo de elementos del array",
          description:
            "El tipo de dato de cada elemento dentro del array. Solo aplica si el tipo de dato es Array.",
          required: false,
          defaultValue: "string",
          options: {
            disabled: false,
            options: [
              { label: "Texto", value: "string" },
              { label: "Número", value: "number" },
              { label: "Booleano", value: "boolean" },
            ],
          },
        }),
        required: Property.Checkbox({
          displayName: "Parámetro obligatorio",
          description: "Si está marcado, el agente debe extraer este valor.",
          required: false,
          defaultValue: false,
        }),
        description: Property.LongText({
          displayName: "Descripción",
          description:
            "Una breve descripción para que el agente entienda cómo funciona este parámetro.",
          required: false,
        }),
      },
    }),
    execution_mode: Property.StaticDropdown({
      displayName: "Modo de ejecución",
      description:
        "Síncrono: El agente espera la respuesta del workflow. " +
        "IMPORTANTE: Debes añadir la acción 'Diga - Return Response' al final del flow para devolver la respuesta. " +
        "Asíncrono: El agente continúa sin esperar la respuesta.",
      required: true,
      defaultValue: "sync",
      options: {
        disabled: false,
        options: [
          { label: "Síncrono (espera respuesta)", value: "sync" },
          { label: "Asíncrono (no espera)", value: "async" },
        ],
      },
    }),
    require_user_confirmation: Property.Checkbox({
      displayName: "Requiere confirmación del usuario",
      description:
        "Si está marcado, el agente pedirá confirmación al usuario antes de ejecutar esta función. " +
        "Útil para acciones importantes como agendar citas, realizar compras, etc.",
      required: false,
      defaultValue: false,
    }),
  },
  sampleData: {
    call_id: "550e8400-e29b-41d4-a716-446655440000",
    function_name: "agendar_cita",
    arguments: {
      fecha: "2024-01-20",
      hora: "10:00",
      servicio: "consulta",
      servicios_adicionales: ["masaje", "facial", "manicure"],
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

    // Convert form parameters to JSON Schema
    const parameters = (context.propsValue.parameters ||
      []) as ParameterDefinition[];
    const parametersSchema = parametersToJsonSchema(parameters);

    // Get new configuration options
    const executionMode = context.propsValue.execution_mode || "sync";
    const requireUserConfirmation =
      context.propsValue.require_user_confirmation || false;

    // Append /sync to webhook URL for sync mode
    const webhookUrl =
      executionMode === "sync"
        ? `${context.webhookUrl}/sync`
        : context.webhookUrl;

    const response = await fetch(
      `${DIGA_API_URL}/internal/v1/ap/triggers/function-call`,
      {
        method: "POST",
        headers: {
          "x-ap-project-id": projectId,
          "x-ap-secret": DIGA_AP_SECRET,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          flow_id: flowId,
          webhook_url: webhookUrl,
          name: flowName,
          function_name: functionName,
          function_description: context.propsValue.function_description,
          parameters_schema: parametersSchema,
          execution_mode: executionMode,
          require_user_confirmation: requireUserConfirmation,
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
          `${DIGA_API_URL}/internal/v1/ap/triggers/function-call/${flowId}`,
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
