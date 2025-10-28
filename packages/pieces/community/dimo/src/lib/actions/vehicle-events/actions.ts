import { ActionContext, createAction, CustomAuthProperty, Property } from "@activepieces/pieces-framework";
import { AuthenticationType, httpClient } from "@activepieces/pieces-common";
import { VEHICLE_EVENTS_OPERATIONS } from "./constant";
import { VehicleEventsParams, VehicleEventsBodyType } from "./type";
import { dimoAuth } from '../../../index';
import { DimoClient, vehicleEventTriggerToText } from "../../common/helpers";
import { operatorStaticDropdown, verificationTokenInput } from '../../common/props';
import { TriggerField } from '../../common/constants';

async function sendVehicleEventsRequest({ ctx, opKey }: { ctx: ActionContext<CustomAuthProperty<any>>, opKey: keyof typeof VEHICLE_EVENTS_OPERATIONS }) {
  const op = VEHICLE_EVENTS_OPERATIONS[opKey];
  const { webhookId, tokenId, data, operator, triggerNumber, triggerExpression, triggerFrequency, targetUri, status, verificationToken, description } = ctx.propsValue;
  const { clientId, apiKey, redirectUri } = ctx.auth;
  const dimo = new DimoClient({ clientId, apiKey, redirectUri });

  const developerJwt = await dimo.getDeveloperJwt();

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
    case VehicleEventsBodyType.WebhookDefinition: {
        body = {
          service: 'Telemetry',
          data,
          setup: triggerFrequency,
          description,
          target_uri: targetUri,
          status,
          verification_token: verificationToken,
          trigger: vehicleEventTriggerToText(data, operator, triggerNumber, triggerExpression)
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

const upsertWebhookNumericAction = createAction({
  auth: dimoAuth,
  name: "vehicle-events-upsert-webhook-numeric-action",
  displayName: "Vehicle Events: Create/Update Webhook (Numeric)",
  description: "Create a new webhook or update existing one for numeric vehicle signals. If Webhook ID is provided, it will update; otherwise, it will create a new webhook.",
  props: {
    webhookId: Property.ShortText({
      displayName: "Webhook ID (Optional)",
      description: "ID of the webhook to update. Leave empty to create a new webhook.",
      required: false,
    }),
    data: Property.StaticDropdown({
      displayName: 'Signal/Data',
      description: 'Which numeric vehicle signal to monitor',
      required: true,
      options: {
        options: [
          { label: 'Speed', value: TriggerField.Speed },
          { label: 'Travelled Distance', value: TriggerField.PowertrainTransmissionTravelledDistance },
          { label: 'Fuel Level (Relative)', value: TriggerField.PowertrainFuelSystemRelativeLevel },
          { label: 'Fuel Level (Absolute)', value: TriggerField.PowertrainFuelSystemAbsoluteLevel },
          { label: 'Battery Power', value: TriggerField.PowertrainTractionBatteryCurrentPower },
          { label: 'Battery State of Charge', value: TriggerField.PowertrainTractionBatteryStateOfChargeCurrent },
          { label: 'Tire Pressure (Front Left)', value: TriggerField.ChassisAxleRow1WheelLeftTirePressure },
          { label: 'Tire Pressure (Front Right)', value: TriggerField.ChassisAxleRow1WheelRightTirePressure },
          { label: 'Tire Pressure (Rear Left)', value: TriggerField.ChassisAxleRow2WheelLeftTirePressure },
          { label: 'Tire Pressure (Rear Right)', value: TriggerField.ChassisAxleRow2WheelRightTirePressure },
        ],
      },
    }),
    operator: operatorStaticDropdown,
    triggerNumber: Property.Number({
      displayName: 'Trigger Value',
      description: 'Numeric value to compare against (e.g., speed in km/h, fuel percentage, battery watts, tire pressure in PSI)',
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
    const { webhookId } = ctx.propsValue;
    const opKey = webhookId ? "updateWebhook" : "createWebhook";
    return sendVehicleEventsRequest({ ctx, opKey });
  },
});

const upsertWebhookBooleanAction = createAction({
  auth: dimoAuth,
  name: "vehicle-events-upsert-webhook-boolean-action",
  displayName: "Vehicle Events: Create/Update Webhook (Boolean)",
  description: "Create a new webhook or update existing one for boolean vehicle signals. If Webhook ID is provided, it will update; otherwise, it will create a new webhook.",
  props: {
    webhookId: Property.ShortText({
      displayName: "Webhook ID (Optional)",
      description: "ID of the webhook to update. Leave empty to create a new webhook.",
      required: false,
    }),
    data: Property.StaticDropdown({
      displayName: 'Signal/Data',
      description: 'Which boolean vehicle signal to monitor',
      required: true,
      options: {
        options: [
          { label: 'Battery Charging Status', value: TriggerField.PowertrainTractionBatteryChargingIsCharging },
           { label: 'Ignition Status', value: TriggerField.IsIgnitionOn },
        ],
      },
    }),
    operator: Property.StaticDropdown({
      displayName: 'Operator',
      description: 'Comparison operator',
      required: true,
      defaultValue: 'equal',
      options: {
        options: [
          { label: 'Is', value: 'equal' },
        ],
      },
    }),
    triggerExpression: Property.Checkbox({
      displayName: 'Trigger Value',
      description: 'Boolean value to compare against (checked = true/charging, unchecked = false/not charging)',
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
    const { webhookId } = ctx.propsValue;
    const opKey = webhookId ? "updateWebhook" : "createWebhook";
    return sendVehicleEventsRequest({ ctx, opKey });
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
  upsertWebhookNumericAction,
  upsertWebhookBooleanAction,
  deleteWebhookAction,
  listSignalsAction,
  listSubscribedVehiclesAction,
  listVehicleSubscriptionsAction,
  subscribeVehicleAction,
  subscribeAllVehiclesAction,
  unsubscribeVehicleAction,
  unsubscribeAllVehiclesAction,
]
