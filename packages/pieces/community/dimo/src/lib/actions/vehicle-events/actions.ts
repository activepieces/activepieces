import { ActionContext, createAction, CustomAuthProperty, Property } from "@activepieces/pieces-framework";
import { AuthenticationType, httpClient, HttpMethod } from "@activepieces/pieces-common";
import { VEHICLE_EVENTS_OPERATIONS } from "./constant";
import { VehicleEventsParams, VehicleEventsBodyType } from "./type";
import { dimoAuth } from '../../../index';
import { DimoClient, vehicleEventTriggerToText } from "../../common/helpers";
import { operatorStaticDropdown, verificationTokenInput } from '../../common/props';
import { TriggerField } from '../../common/constants';
import type { CreateWebhookParams, VehicleEventTrigger } from '../../common/types';

async function sendVehicleEventsRequest({ ctx, opKey }: { ctx: ActionContext<CustomAuthProperty<any>>, opKey: keyof typeof VEHICLE_EVENTS_OPERATIONS }) {
  const op = VEHICLE_EVENTS_OPERATIONS[opKey];
  const { webhookId, tokenId, data, operator, value, triggerFrequency, targetUri, status, verificationToken, description } = ctx.propsValue;
  const { clientId, apiKey, redirectUri } = ctx.auth;
  const dimo = new DimoClient({ clientId, apiKey, redirectUri });

  const developerJwt = await dimo.getDeveloperJwt();

  let webhookDefinition: CreateWebhookParams | undefined = undefined;

  if (op.bodyType === VehicleEventsBodyType.WebhookDefinition) {
    const trigger = { field: data, operator, value } as VehicleEventTrigger;
    webhookDefinition = {
      service: 'Telemetry',
      data,
      trigger: trigger,
      setup: triggerFrequency,
      description,
      target_uri: targetUri,
      status,
      verification_token: verificationToken,
    };
  }
  if (op.requiredFields) {
    for (const field of op.requiredFields) {
      if (field === 'webhookDefinition') {
        if (webhookDefinition === undefined || webhookDefinition === null) {
          throw new Error(`webhookDefinition is required for this operation.`);
        }
      } else {
        if (ctx.propsValue[field] === undefined || ctx.propsValue[field] === null || ctx.propsValue[field] === "") {
          throw new Error(`${field} is required for this operation.`);
        }
      }
    }
  }
  const params: VehicleEventsParams = { webhookId, tokenId };
  const url = op.url(params);
  const method = op.method;
  let body: unknown = undefined;
  switch (op.bodyType) {
    case VehicleEventsBodyType.WebhookDefinition: {
        const { trigger, ...rest } = webhookDefinition!;
        body = {
          ...rest,
          trigger: vehicleEventTriggerToText(trigger)
        }
      break;
    }
    case VehicleEventsBodyType.None:
    default:
      body = undefined;
  }
  const response = await httpClient.sendRequest({
    method,
    url,
    ...(body ? { body } : {}),
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: developerJwt,
    },
  });

  if(response.status > 299)
  {
    throw new Error(`Error calling Vehicle Events API: ${response.body?.message || response.status}`);
  }

  return response.body;
}

const listWebhooksAction = createAction({
  auth: dimoAuth,
  name: "vehicle-events-list-webhooks-action",
  displayName: "Vehicle Events: List Webhooks",
  description: "List all webhooks.",
  props: {},
  async run(ctx) {
    return sendVehicleEventsRequest({ ctx, opKey: "listWebhooks" });
  },
});

const createWebhookAction = createAction({
  auth: dimoAuth,
  name: "vehicle-events-create-webhook-action",
  displayName: "Vehicle Events: Create Webhook",
  description: "Create a new webhook.",
  props: {
    data: Property.StaticDropdown({
      displayName: 'Signal/Data',
      description: 'Which vehicle signal to monitor',
      required: true,
      options: {
        options: Object.values(TriggerField).map((field) => ({ label: field, value: field })),
      },
    }),
    operator: operatorStaticDropdown,
    value: Property.ShortText({
      displayName: 'Trigger Value',
      description: 'Value to compare against (number, boolean için true/false, string için text)',
      required: true,
    }),
    triggerFrequency: Property.StaticDropdown({
      displayName: 'Trigger Frequency',
      description: 'How often the webhook should fire when condition is met',
      required: true,
      defaultValue: 'Realtime',
      options: {
        options: [
          { label: 'Real-time (continuous)', value: 'Realtime' },
          { label: 'Hourly', value: 'Hourly' },
        ],
      },
    }),
    targetUri: Property.ShortText({
      displayName: 'Target URI',
      description: 'Webhook endpoint to send events to',
      required: true,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Webhook status',
      required: true,
      defaultValue: 'Active',
      options: {
        options: [
          { label: 'Active', value: 'Active' },
          { label: 'Inactive', value: 'Inactive' },
        ],
      },
    }),
    verificationToken: verificationTokenInput,
    description: Property.ShortText({
      displayName: 'Description',
      description: 'Webhook description (optional)',
      required: false,
    }),
  },
  async run(ctx) {
    return sendVehicleEventsRequest({ ctx, opKey: "createWebhook" });
  },
});

const updateWebhookAction = createAction({
  auth: dimoAuth,
  name: "vehicle-events-update-webhook-action",
  displayName: "Vehicle Events: Update Webhook",
  description: "Update an existing webhook.",
  props: {
    webhookId: Property.ShortText({
      displayName: "Webhook ID",
      description: "ID of the webhook.",
      required: true,
    }),
    data: Property.StaticDropdown({
      displayName: 'Signal/Data',
      description: 'Which vehicle signal to monitor',
      required: true,
      options: {
        options: Object.values(TriggerField).map((field) => ({ label: field, value: field })),
      },
    }),
    operator: operatorStaticDropdown,
    value: Property.ShortText({
      displayName: 'Trigger Value',
      description: 'Value to compare against (number, boolean için true/false, string için text)',
      required: true,
    }),
    triggerFrequency: Property.StaticDropdown({
      displayName: 'Trigger Frequency',
      description: 'How often the webhook should fire when condition is met',
      required: true,
      defaultValue: 'Realtime',
      options: {
        options: [
          { label: 'Real-time (continuous)', value: 'Realtime' },
          { label: 'Hourly', value: 'Hourly' },
        ],
      },
    }),
    targetUri: Property.ShortText({
      displayName: 'Target URI',
      description: 'Webhook endpoint to send events to',
      required: true,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Webhook status',
      required: true,
      defaultValue: 'Active',
      options: {
        options: [
          { label: 'Active', value: 'Active' },
          { label: 'Inactive', value: 'Inactive' },
        ],
      },
    }),
    verificationToken: verificationTokenInput,
    description: Property.ShortText({
      displayName: 'Description',
      description: 'Webhook description (optional)',
      required: false,
    }),
  },
  async run(ctx) {
    return sendVehicleEventsRequest({ ctx, opKey: "updateWebhook" });
  },
});

const deleteWebhookAction = createAction({
  auth: dimoAuth,
  name: "vehicle-events-delete-webhook-action",
  displayName: "Vehicle Events: Delete Webhook",
  description: "Delete a webhook.",
  props: {
    webhookId: Property.ShortText({
      displayName: "Webhook ID",
      description: "ID of the webhook.",
      required: true,
    }),
  },
  async run(ctx) {
    return sendVehicleEventsRequest({ ctx, opKey: "deleteWebhook" });
  },
});

const listSignalsAction = createAction({
  auth: dimoAuth,
  name: "vehicle-events-list-signals-action",
  displayName: "Vehicle Events: List Signals",
  description: "List all signals.",
  props: {},
  async run(ctx) {
    return sendVehicleEventsRequest({ ctx, opKey: "listSignals" });
  },
});

const listSubscribedVehiclesAction = createAction({
  auth: dimoAuth,
  name: "vehicle-events-list-subscribed-vehicles-action",
  displayName: "Vehicle Events: List Subscribed Vehicles",
  description: "List vehicles subscribed to a webhook.",
  props: {
    webhookId: Property.ShortText({
      displayName: "Webhook ID",
      description: "ID of the webhook.",
      required: true,
    }),
  },
  async run(ctx) {
    return sendVehicleEventsRequest({ ctx, opKey: "listSubscribedVehicles" });
  },
});

const listVehicleSubscriptionsAction = createAction({
  auth: dimoAuth,
  name: "vehicle-events-list-vehicle-subscriptions-action",
  displayName: "Vehicle Events: List Vehicle Subscriptions",
  description: "List all subscriptions for a vehicle.",
  props: {
    tokenId: Property.Number({
      displayName: "Vehicle Token ID",
      description: "Token ID of the vehicle.",
      required: true,
    }),
  },
  async run(ctx) {
    return sendVehicleEventsRequest({ ctx, opKey: "listVehicleSubscriptions" });
  },
});

const subscribeVehicleAction = createAction({
  auth: dimoAuth,
  name: "vehicle-events-subscribe-vehicle-action",
  displayName: "Vehicle Events: Subscribe Vehicle",
  description: "Subscribe a vehicle to a webhook.",
  props: {
    webhookId: Property.ShortText({
      displayName: "Webhook ID",
      description: "ID of the webhook.",
      required: true,
    }),
    tokenId: Property.Number({
      displayName: "Vehicle Token ID",
      description: "Token ID of the vehicle.",
      required: true,
    }),
  },
  async run(ctx) {
    return sendVehicleEventsRequest({ ctx, opKey: "subscribeVehicle" });
  },
});

const subscribeAllVehiclesAction = createAction({
  auth: dimoAuth,
  name: "vehicle-events-subscribe-all-vehicles-action",
  displayName: "Vehicle Events: Subscribe All Vehicles",
  description: "Subscribe all vehicles to a webhook.",
  props: {
    webhookId: Property.ShortText({
      displayName: "Webhook ID",
      description: "ID of the webhook.",
      required: true,
    }),
  },
  async run(ctx) {
    return sendVehicleEventsRequest({ ctx, opKey: "subscribeAllVehicles" });
  },
});

const unsubscribeVehicleAction = createAction({
  auth: dimoAuth,
  name: "vehicle-events-unsubscribe-vehicle-action",
  displayName: "Vehicle Events: Unsubscribe Vehicle",
  description: "Unsubscribe a vehicle from a webhook.",
  props: {
    webhookId: Property.ShortText({
      displayName: "Webhook ID",
      description: "ID of the webhook.",
      required: true,
    }),
    tokenId: Property.Number({
      displayName: "Vehicle Token ID",
      description: "Token ID of the vehicle.",
      required: true,
    }),
  },
  async run(ctx) {
    return sendVehicleEventsRequest({ ctx, opKey: "unsubscribeVehicle" });
  },
});

const unsubscribeAllVehiclesAction = createAction({
  auth: dimoAuth,
  name: "vehicle-events-unsubscribe-all-vehicles-action",
  displayName: "Vehicle Events: Unsubscribe All Vehicles",
  description: "Unsubscribe all vehicles from a webhook.",
  props: {
    webhookId: Property.ShortText({
      displayName: "Webhook ID",
      description: "ID of the webhook.",
      required: true,
    }),
  },
  async run(ctx) {
    return sendVehicleEventsRequest({ ctx, opKey: "unsubscribeAllVehicles" });
  },
});



export const vehicleEventsApiActions = [
  listWebhooksAction,
  createWebhookAction,
  updateWebhookAction,
  deleteWebhookAction,
  listSignalsAction,
  listSubscribedVehiclesAction,
  listVehicleSubscriptionsAction,
  subscribeVehicleAction,
  subscribeAllVehiclesAction,
  unsubscribeVehicleAction,
  unsubscribeAllVehiclesAction,
]
