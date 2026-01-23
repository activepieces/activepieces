import {
  createAction,
  PieceAuth,
  Property,
} from "@activepieces/pieces-framework";
import { DIGA_API_URL, DIGA_AP_SECRET } from "../common/config";

// Type definitions for API responses
type PhoneNumberOption = {
  id: string;
  number: string;
  nickname: string | null;
  has_outbound_agent: boolean;
};

type AgentVersionOption = {
  id: string;
  agent_name: string;
  version_number: number;
  is_published: boolean;
};

export const makeCall = createAction({
  name: "makeCall",
  displayName: "Make Outbound Call",
  description:
    "Inicia una llamada saliente usando uno de tus numeros de telefono. " +
    "Ideal para automatizaciones como recordatorios de citas, seguimientos, o notificaciones.",
  props: {
    from_number: Property.Dropdown({
      auth: PieceAuth.None(),
      displayName: "Numero de origen",
      description:
        "El numero de telefono desde el que se realizara la llamada.",
      required: true,
      refreshers: [],
      options: async (_propsValue, context) => {
        const projectId = context.project.id;

        try {
          const response = await fetch(
            `${DIGA_API_URL}/internal/v1/ap/phone-numbers`,
            {
              method: "GET",
              headers: {
                "x-ap-project-id": projectId,
                "x-ap-secret": DIGA_AP_SECRET,
              },
            }
          );

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }

          const phones: PhoneNumberOption[] = await response.json();

          if (phones.length === 0) {
            return {
              disabled: true,
              placeholder: "No tienes numeros de telefono configurados",
              options: [],
            };
          }

          return {
            options: phones.map((phone) => ({
              label: phone.nickname
                ? `${phone.nickname} (${phone.number})`
                : phone.number,
              value: phone.number,
            })),
          };
        } catch (error) {
          console.error("Error fetching phone numbers:", error);
          return {
            disabled: true,
            placeholder: "Error al cargar los numeros de telefono",
            options: [],
          };
        }
      },
    }),

    to_number: Property.ShortText({
      displayName: "Numero de destino",
      description:
        "El numero de telefono al que se llamara, en formato E.164 (ej: +34600123456).",
      required: true,
    }),

    agent_version_id: Property.Dropdown({
      auth: PieceAuth.None(),
      displayName: "Version del agente (opcional)",
      description:
        "Selecciona una version especifica del agente. " +
        "Si no se selecciona, se usara el agente asociado al numero de origen.",
      required: false,
      refreshers: [],
      options: async (_propsValue, context) => {
        const projectId = context.project.id;

        try {
          const response = await fetch(
            `${DIGA_API_URL}/internal/v1/ap/agent-versions`,
            {
              method: "GET",
              headers: {
                "x-ap-project-id": projectId,
                "x-ap-secret": DIGA_AP_SECRET,
              },
            }
          );

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }

          const versions: AgentVersionOption[] = await response.json();

          if (versions.length === 0) {
            return {
              disabled: true,
              placeholder: "No tienes agentes configurados",
              options: [],
            };
          }

          return {
            options: versions.map((version) => ({
              label: version.is_published
                ? `${version.agent_name} v${version.version_number} (publicado)`
                : `${version.agent_name} v${version.version_number}`,
              value: version.id,
            })),
          };
        } catch (error) {
          console.error("Error fetching agent versions:", error);
          return {
            disabled: true,
            placeholder: "Error al cargar los agentes",
            options: [],
          };
        }
      },
    }),

    dynamic_variables: Property.Object({
      displayName: "Variables dinamicas",
      description:
        "Variables para sustituir en el prompt del agente. " +
        "Define pares clave-valor que se insertaran en {{variable}}.",
      required: false,
    }),
  },

  async run(context) {
    const projectId = context.project.id;
    const { from_number, to_number, agent_version_id, dynamic_variables } =
      context.propsValue;

    const response = await fetch(
      `${DIGA_API_URL}/internal/v1/ap/actions/make-call`,
      {
        method: "POST",
        headers: {
          "x-ap-project-id": projectId,
          "x-ap-secret": DIGA_AP_SECRET,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from_number,
          to_number,
          agent_version_id: agent_version_id || null,
          dynamic_variables: dynamic_variables || null,
        }),
      }
    );

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      const detail = errorBody?.detail || (await response.text());

      if (response.status === 401) {
        throw new Error(
          "Error de autenticacion: Verifica que DIGA_AP_SECRET esta configurado correctamente."
        );
      } else if (response.status === 404) {
        throw new Error(
          `Error: ${detail}. Verifica que el numero de origen existe.`
        );
      } else if (response.status === 400) {
        throw new Error(`Error de validacion: ${detail}`);
      } else if (response.status === 412) {
        throw new Error(`Configuracion faltante: ${detail}`);
      } else {
        throw new Error(`Error al realizar la llamada: ${detail}`);
      }
    }

    return await response.json();
  },
});
