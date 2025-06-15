import { createAction, Property } from "@activepieces/pieces-framework";
import { developerAuth } from "../../common/auth";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";
import { getHeaders, handleFailures } from "../../helpers/http-request-helper";
import { VEHICLE_EVENTS_OPERATIONS } from "./constant";
import { VehicleEventsParams, VehicleEventsBodyType } from "./type";
export const vehicleEventsUnifiedAction = createAction({
  auth: developerAuth,
  name: "all-endpoints-vehicle-events-api",
  displayName: "Vehicle Events (All Operations)",
  description: "Perform any vehicle events operation (list, create, update, delete, subscribe, unsubscribe, etc.)",
  props: {
    operation: Property.StaticDropdown({
      displayName: "Operation",
      description: "Select the operation to perform",
      required: true,
      options: {
        options: Object.values(VEHICLE_EVENTS_OPERATIONS).map((op) => ({ label: op.label, value: op.value })),
      },
    }),
    webhookId: Property.ShortText({
      displayName: "Webhook ID",
      description: "ID of the webhook (for update, delete, subscribe, unsubscribe, etc.)",
      required: false,
    }),
    webhookDefinition: Property.Json({
      displayName: "Webhook Definition",
      description: "Webhook definition object (for create/update)",
      required: false,
      defaultValue: {
        service: "Telemetry",
        data: "powertrainTransmissionTravelledDistance",
        trigger: "valueNumber > 1000",
        setup: "Realtime",
        description: "",
        target_uri: "https://mysite.com/webhook",
        status: "Active",
        verification_token: "token",
      },
    }),
    tokenId: Property.Number({
      displayName: "Vehicle Token ID",
      description: "Token ID of the vehicle (for subscribe/unsubscribe/list subscriptions)",
      required: false,
    }),
  },
  async run(ctx) {
    const { operation, webhookId, webhookDefinition, tokenId } = ctx.propsValue;
    const { token } = ctx.auth;
    const op = VEHICLE_EVENTS_OPERATIONS[operation as keyof typeof VEHICLE_EVENTS_OPERATIONS];
    if (!op) throw new Error("Invalid operation selected.");


    if (op.requiredFields) {
      for (const field of op.requiredFields) {
        if (ctx.propsValue[field] === undefined || ctx.propsValue[field] === null || ctx.propsValue[field] === "") {
          throw new Error(`${field} is required for this operation.`);
        }
      }
    }
    const params: VehicleEventsParams = { webhookId, tokenId };
    const url = op.url(params);
    const method = op.method;

    let body: unknown = undefined;
    switch (op.bodyType) {
      case VehicleEventsBodyType.WebhookDefinition:
        body = webhookDefinition;
        break;
      case VehicleEventsBodyType.None:
      default:
        body = undefined;
    }
    const response = await httpClient.sendRequest({
      method,
      url,
      ...(body ? { body } : {}),
      headers: getHeaders(token),
    });
    handleFailures(response);
    if (
      method === HttpMethod.DELETE ||
      (method === HttpMethod.POST && op.bodyType === VehicleEventsBodyType.None)
    ) {
      return { success: true };
    }
    return response.body;
  },
});
