import {
  createAction,
  DynamicPropsValue,
  PieceAuth,
  Property,
} from "@activepieces/pieces-framework";
import { StopResponse } from "@activepieces/shared";
import { StatusCodes } from "http-status-codes";

enum ResponseType {
  JSON = "json",
  RAW = "raw",
}

export const returnResponse = createAction({
  name: "return_response",
  displayName: "Return Response",
  description:
    "Devuelve una respuesta al agente de voz. " +
    "Requerido cuando el trigger 'Function Call' está en modo síncrono.",
  props: {
    responseType: Property.StaticDropdown({
      displayName: "Tipo de respuesta",
      description: "El formato de la respuesta que se enviará al agente.",
      required: true,
      defaultValue: "json",
      options: {
        disabled: false,
        options: [
          {
            label: "JSON",
            value: ResponseType.JSON,
          },
          {
            label: "Texto",
            value: ResponseType.RAW,
          },
        ],
      },
    }),
    fields: Property.DynamicProperties({
      displayName: "Respuesta",
      description: "Configura el contenido de la respuesta.",
      auth: PieceAuth.None(),
      refreshers: ["responseType"],
      required: true,
      props: async ({ responseType }) => {
        if (!responseType) return {};

        const bodyTypeInput = responseType as unknown as ResponseType;
        const fields: DynamicPropsValue = {};

        fields["status"] = Property.Number({
          displayName: "Código de estado HTTP",
          description: "El código de estado HTTP de la respuesta (ej: 200, 400, 500).",
          required: false,
          defaultValue: 200,
        });

        fields["headers"] = Property.Object({
          displayName: "Headers",
          description: "Headers HTTP adicionales para la respuesta.",
          required: false,
        });

        switch (bodyTypeInput) {
          case ResponseType.JSON:
            fields["body"] = Property.Json({
              displayName: "Cuerpo JSON",
              description:
                "El contenido JSON que recibirá el agente. " +
                "Puedes incluir instrucciones o datos que el agente usará para continuar la conversación.",
              required: true,
            });
            break;
          case ResponseType.RAW:
            fields["body"] = Property.LongText({
              displayName: "Cuerpo de texto",
              description:
                "El texto que recibirá el agente. " +
                "Puede ser una instrucción o información para continuar la conversación.",
              required: true,
            });
            break;
        }

        return fields;
      },
    }),
  },

  async run(context) {
    const { fields, responseType } = context.propsValue;
    const bodyInput = fields["body"];
    const headers = (fields["headers"] as Record<string, string>) ?? {};
    const status = fields["status"] as number;

    const response: StopResponse = {
      status: status ?? StatusCodes.OK,
      headers,
    };

    switch (responseType) {
      case ResponseType.JSON:
        response.body = parseToJson(bodyInput);
        break;
      case ResponseType.RAW:
        response.body = bodyInput;
        break;
    }

    // Stop the flow and send the response back to the webhook caller
    context.run.stop({
      response,
    });

    return response;
  },
});

function parseToJson(body: unknown): unknown {
  if (body === undefined || body === null) {
    return {};
  }
  if (typeof body === "string") {
    if (body.trim() === "") {
      return {};
    }
    return JSON.parse(body);
  }
  return JSON.parse(JSON.stringify(body));
}
