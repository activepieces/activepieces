import { HttpMethod } from "@activepieces/pieces-common";
import { VehicleEventsOperation, VehicleEventsBodyType } from "./type";

const vehicleEventsBaseUrl = "https://vehicle-events-api.dimo.zone";
const webhooksBaseUrl = `${vehicleEventsBaseUrl}/v1/webhooks`;
const signalsUrl = `${webhooksBaseUrl}/signals`;
const vehiclesUrl = `${webhooksBaseUrl}/vehicles`;

export type VehicleEventKeys =
  | "listWebhooks"
  | "createWebhook"
  | "updateWebhook"
  | "deleteWebhook"
  | "listSignals"
  | "listSubscribedVehicles"
  | "listVehicleSubscriptions"
  | "subscribeVehicle"
  | "subscribeAllVehicles"
  | "unsubscribeVehicle"
  | "unsubscribeAllVehicles";

export const VEHICLE_EVENTS_OPERATIONS: Record<VehicleEventKeys, VehicleEventsOperation> = {
  listWebhooks: {
    label: "List Webhooks",
    value: "listWebhooks",
    method: HttpMethod.GET,
    url: () => webhooksBaseUrl,
    bodyType: VehicleEventsBodyType.None,
  },
  createWebhook: {
    label: "Create Webhook",
    value: "createWebhook",
    method: HttpMethod.POST,
    url: () => webhooksBaseUrl,
    bodyType: VehicleEventsBodyType.WebhookDefinition,
    requiredFields: [],
  },
  updateWebhook: {
    label: "Update Webhook",
    value: "updateWebhook",
    method: HttpMethod.PUT,
    url: (params) => `${webhooksBaseUrl}/${params.webhookId}`,
    bodyType: VehicleEventsBodyType.WebhookDefinition,
    requiredFields: ["webhookId"],
  },
  deleteWebhook: {
    label: "Delete Webhook",
    value: "deleteWebhook",
    method: HttpMethod.DELETE,
    url: (params) => `${webhooksBaseUrl}/${params.webhookId}`,
    bodyType: VehicleEventsBodyType.None,
    requiredFields: ["webhookId"],
  },
  listSignals: {
    label: "List Signals",
    value: "listSignals",
    method: HttpMethod.GET,
    url: () => signalsUrl,
    bodyType: VehicleEventsBodyType.None,
  },
  listSubscribedVehicles: {
    label: "List Subscribed Vehicles",
    value: "listSubscribedVehicles",
    method: HttpMethod.GET,
    url: (params) => `${webhooksBaseUrl}/${params.webhookId}`,
    bodyType: VehicleEventsBodyType.None,
    requiredFields: ["webhookId"],
  },
  listVehicleSubscriptions: {
    label: "List Vehicle Subscriptions",
    value: "listVehicleSubscriptions",
    method: HttpMethod.GET,
    url: (params) => `${vehiclesUrl}/${params.tokenId}`,
    bodyType: VehicleEventsBodyType.None,
    requiredFields: ["tokenId"],
  },
  subscribeVehicle: {
    label: "Subscribe Vehicle",
    value: "subscribeVehicle",
    method: HttpMethod.POST,
    url: (params) => `${webhooksBaseUrl}/${params.webhookId}/subscribe/${params.tokenId}`,
    bodyType: VehicleEventsBodyType.None,
    requiredFields: ["webhookId", "tokenId"],
  },
  subscribeAllVehicles: {
    label: "Subscribe All Vehicles",
    value: "subscribeAllVehicles",
    method: HttpMethod.POST,
    url: (params) => `${webhooksBaseUrl}/${params.webhookId}/subscribe/all`,
    bodyType: VehicleEventsBodyType.None,
    requiredFields: ["webhookId"],
  },
  unsubscribeVehicle: {
    label: "Unsubscribe Vehicle",
    value: "unsubscribeVehicle",
    method: HttpMethod.DELETE,
    url: (params) => `${webhooksBaseUrl}/${params.webhookId}/unsubscribe/${params.tokenId}`,
    bodyType: VehicleEventsBodyType.None,
    requiredFields: ["webhookId", "tokenId"],
  },
  unsubscribeAllVehicles: {
    label: "Unsubscribe All Vehicles",
    value: "unsubscribeAllVehicles",
    method: HttpMethod.DELETE,
    url: (params) => `${webhooksBaseUrl}/${params.webhookId}/unsubscribe/all`,
    bodyType: VehicleEventsBodyType.None,
    requiredFields: ["webhookId"],
  },
};
