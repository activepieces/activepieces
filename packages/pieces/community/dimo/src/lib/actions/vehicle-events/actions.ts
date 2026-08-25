import { ActionContext, createAction, CustomAuthProperty, Property } from "@activepieces/pieces-framework";
import { AuthenticationType, httpClient } from "@activepieces/pieces-common";
import { VEHICLE_EVENTS_OPERATIONS } from "./constant";
import { VehicleEventsParams, VehicleEventsBodyType } from "./type";
import { dimoAuth } from '../../auth';
import { DimoClient, vehicleEventTriggerToText } from "../../common/helpers";
import { operatorStaticDropdown, verificationTokenInput } from '../../common/props';
import { TriggerField } from '../../common/constants';

async function sendVehicleEventsRequest({ ctx, opKey }: { ctx: ActionContext<CustomAuthProperty<any>>, opKey: keyof typeof VEHICLE_EVENTS_OPERATIONS }) {
  const op = VEHICLE_EVENTS_OPERATIONS[opKey];
  const { webhookId, tokenId, data, operator, triggerNumber, triggerExpression, coolDownPeriod, targetURL, status, verificationToken, description, displayName } = ctx.propsValue;
  const { clientId, apiKey, redirectUri } = ctx.auth.props;
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
          service: 'telemetry.signals',
          metricName: data,
          condition: vehicleEventTriggerToText(data, operator, triggerNumber, triggerExpression),
          coolDownPeriod,
          ...(displayName ? { displayName } : {}),
          ...(description ? { description } : {}),
          targetURL,
          status,
          verificationToken,
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
  audience: 'both',
  aiMetadata: { description: 'List all DIMO Vehicle Events webhooks configured under the developer account. Read-only and idempotent; pick this to discover existing webhook IDs and their configuration before creating, updating, subscribing, or deleting.', idempotent: true },
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
  audience: 'both',
  aiMetadata: { description: 'Create or update a Vehicle Events webhook that fires when a numeric signal (speed, fuel level, battery state of charge, tire pressure, etc.) crosses a threshold via an operator and trigger value. Supplying a Webhook ID updates that webhook (idempotent); omitting it creates a new one each call (not idempotent). Use the Boolean variant for on/off signals and the Events variant for driving events like harsh braking.', idempotent: false },
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
    coolDownPeriod: Property.Number({
      displayName: 'Cool Down Period (seconds)',
      description: 'Minimum number of seconds between successive webhook firings',
      required: true,
      defaultValue: 30,
    }),
    targetURL: Property.ShortText({
      displayName: 'Target URL',
      description: 'HTTPS endpoint URL that will receive webhook callbacks',
      required: true,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Webhook status',
      required: true,
      defaultValue: 'enabled',
      options: {
        options: [
          { label: 'Enabled', value: 'enabled' },
          { label: 'Disabled', value: 'disabled' },
        ],
      },
    }),
    verificationToken: verificationTokenInput,
    displayName: Property.ShortText({
      displayName: 'Display Name',
      description: 'Optional name to easily identify your webhook (defaults to webhook ID if not provided)',
      required: false,
    }),
    description: Property.ShortText({
      displayName: 'Description',
      description: 'Brief description of the webhook conditions for your reference (optional)',
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
  audience: 'both',
  aiMetadata: { description: 'Create or update a Vehicle Events webhook that fires on a boolean signal state (battery charging on/off, ignition on/off). Supplying a Webhook ID updates that webhook (idempotent); omitting it creates a new one each call (not idempotent). Use the Numeric variant for threshold signals and the Events variant for driving events.', idempotent: false },
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
    coolDownPeriod: Property.Number({
      displayName: 'Cool Down Period (seconds)',
      description: 'Minimum number of seconds between successive webhook firings',
      required: true,
      defaultValue: 30,
    }),
    targetURL: Property.ShortText({
      displayName: 'Target URL',
      description: 'HTTPS endpoint URL that will receive webhook callbacks',
      required: true,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Webhook status',
      required: true,
      defaultValue: 'enabled',
      options: {
        options: [
          { label: 'Enabled', value: 'enabled' },
          { label: 'Disabled', value: 'disabled' },
        ],
      },
    }),
    verificationToken: verificationTokenInput,
    displayName: Property.ShortText({
      displayName: 'Display Name',
      description: 'Optional name to easily identify your webhook (defaults to webhook ID if not provided)',
      required: false,
    }),
    description: Property.ShortText({
      displayName: 'Description',
      description: 'Brief description of the webhook conditions for your reference (optional)',
      required: false,
    }),
  },
  async run(ctx) {
    const { webhookId } = ctx.propsValue;
    const opKey = webhookId ? "updateWebhook" : "createWebhook";
    return sendVehicleEventsRequest({ ctx, opKey });
  },
});

const upsertWebhookEventAction = createAction({
  auth: dimoAuth,
  name: "vehicle-events-upsert-webhook-event-action",
  displayName: "Vehicle Events: Create/Update Webhook (Events)",
  description: "Create a new webhook or update existing one for vehicle events like harsh braking, acceleration, etc. If Webhook ID is provided, it will update; otherwise, it will create a new webhook.",
  audience: 'both',
  aiMetadata: { description: 'Create or update a Vehicle Events webhook that fires on discrete driving events (extreme/harsh braking, harsh acceleration, harsh cornering). Supplying a Webhook ID updates that webhook (idempotent); omitting it creates a new one each call (not idempotent). Use the Numeric or Boolean variants instead when monitoring signal values rather than driving events.', idempotent: false },
  props: {
    webhookId: Property.ShortText({
      displayName: "Webhook ID (Optional)",
      description: "ID of the webhook to update. Leave empty to create a new webhook.",
      required: false,
    }),
    eventType: Property.StaticDropdown({
      displayName: 'Event Type',
      description: 'Which vehicle event to monitor',
      required: true,
      options: {
        options: [
          { label: 'Extreme Braking', value: 'ExtremeBraking' },
          { label: 'Harsh Acceleration', value: 'HarshAcceleration' },
          { label: 'Harsh Braking', value: 'HarshBraking' },
          { label: 'Harsh Cornering', value: 'HarshCornering' },
        ],
      },
    }),
    coolDownPeriod: Property.Number({
      displayName: 'Cool Down Period (seconds)',
      description: 'Minimum number of seconds between successive webhook firings',
      required: true,
      defaultValue: 30,
    }),
    targetURL: Property.ShortText({
      displayName: 'Target URL',
      description: 'HTTPS endpoint URL that will receive webhook callbacks',
      required: true,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Webhook status',
      required: true,
      defaultValue: 'enabled',
      options: {
        options: [
          { label: 'Enabled', value: 'enabled' },
          { label: 'Disabled', value: 'disabled' },
        ],
      },
    }),
    verificationToken: verificationTokenInput,
    displayName: Property.ShortText({
      displayName: 'Display Name',
      description: 'Optional name to easily identify your webhook (defaults to webhook ID if not provided)',
      required: false,
    }),
    description: Property.ShortText({
      displayName: 'Description',
      description: 'Brief description of the webhook conditions for your reference (optional)',
      required: false,
    }),
  },
  async run(ctx) {
    const { webhookId, eventType, coolDownPeriod, targetURL, status, verificationToken, displayName, description } = ctx.propsValue;
    const { clientId, apiKey, redirectUri } = ctx.auth.props;
    const dimo = new DimoClient({ clientId, apiKey, redirectUri });

    const developerJwt = await dimo.getDeveloperJwt();

    const op = VEHICLE_EVENTS_OPERATIONS[webhookId ? "updateWebhook" : "createWebhook"];
    const params: VehicleEventsParams = { webhookId };
    const url = op.url(params);
    const method = op.method;

    const body = {
      service: 'telemetry.events',
      metricName: eventType,
      condition: 'true',  // Events always trigger when they occur
      coolDownPeriod,
      ...(displayName ? { displayName } : {}),
      ...(description ? { description } : {}),
      targetURL,
      status,
      verificationToken,
    };

    const response = await httpClient.sendRequest({
      method,
      url,
      body,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: developerJwt,
      },
    });

    if(response.status > 299) {
      throw new Error(`Error calling Vehicle Events API: ${response.body?.message || response.status}`);
    }

    return response.body;
  },
});

const deleteWebhookAction = createAction({
  auth: dimoAuth,
  name: "vehicle-events-delete-webhook-action",
  displayName: "Vehicle Events: Delete Webhook",
  description: "Delete a webhook.",
  audience: 'both',
  aiMetadata: { description: 'Permanently delete a Vehicle Events webhook by its Webhook ID, removing it and its vehicle subscriptions. Destructive and not idempotent (deleting an already-removed webhook errors); pick this to tear down a webhook rather than disabling it via the Status field on a Create/Update action.', idempotent: false },
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
  audience: 'both',
  aiMetadata: { description: 'List the signal names available for use in Vehicle Events webhook conditions. Read-only and idempotent; pick this to discover valid signals before creating or updating a numeric/boolean webhook.', idempotent: true },
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
  audience: 'both',
  aiMetadata: { description: 'List the vehicles currently subscribed to a given webhook, taking the Webhook ID. Read-only and idempotent; pick this to see which vehicles a webhook covers, versus List Vehicle Subscriptions which goes the other direction (all webhooks a single vehicle is subscribed to).', idempotent: true },
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
  audience: 'both',
  aiMetadata: { description: 'List all webhook subscriptions for a single vehicle, taking the vehicle Token ID. Read-only and idempotent; pick this to see which webhooks one vehicle is subscribed to, versus List Subscribed Vehicles which lists all vehicles on a given webhook.', idempotent: true },
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
  audience: 'both',
  aiMetadata: { description: 'Subscribe one vehicle (by Token ID) to a specific webhook (by Webhook ID) so it begins firing for that vehicle. A targeted mutation; pick this for a single vehicle, versus Subscribe All Vehicles to enroll every eligible vehicle on the developer license at once.', idempotent: false },
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
    const { webhookId, tokenId } = ctx.propsValue;
    const { clientId, apiKey, redirectUri } = ctx.auth.props;
    const dimo = new DimoClient({ clientId, apiKey, redirectUri });

    const developerJwt = await dimo.getDeveloperJwt();
    const tokenDID = await dimo.getVehicleTokenDID({ tokenId });

    return await dimo.subscribeVehicle({ 
      developerJwt, 
      webhookId, 
      tokenDID 
    });
  },
});

const subscribeAllVehiclesAction = createAction({
  auth: dimoAuth,
  name: "vehicle-events-subscribe-all-vehicles-action",
  displayName: "Vehicle Events: Subscribe All Vehicles",
  description: "Subscribe all vehicles to a webhook.",
  audience: 'both',
  aiMetadata: { description: 'Subscribe every eligible vehicle on the developer license to a given webhook (by Webhook ID) in one call. A bulk mutation that affects all vehicles; pick Subscribe Vehicle instead when you only need a single vehicle enrolled.', idempotent: false },
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
  audience: 'both',
  aiMetadata: { description: 'Remove one vehicle (by Token ID) from a specific webhook (by Webhook ID) so it stops firing for that vehicle. A targeted mutation; pick this for a single vehicle, versus Unsubscribe All Vehicles to detach every vehicle from the webhook at once.', idempotent: false },
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
    const { webhookId, tokenId } = ctx.propsValue;
    const { clientId, apiKey, redirectUri } = ctx.auth.props;
    const dimo = new DimoClient({ clientId, apiKey, redirectUri });

    const developerJwt = await dimo.getDeveloperJwt();
    const tokenDID = await dimo.getVehicleTokenDID({ tokenId });

    return await dimo.unsubscribeVehicle({ 
      developerJwt, 
      webhookId, 
      tokenDID 
    });
  },
});

const unsubscribeAllVehiclesAction = createAction({
  auth: dimoAuth,
  name: "vehicle-events-unsubscribe-all-vehicles-action",
  displayName: "Vehicle Events: Unsubscribe All Vehicles",
  description: "Unsubscribe all vehicles from a webhook.",
  audience: 'both',
  aiMetadata: { description: 'Remove every subscribed vehicle from a given webhook (by Webhook ID) in one call, leaving the webhook itself intact. A bulk mutation; pick Unsubscribe Vehicle instead when you only need to detach a single vehicle.', idempotent: false },
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
  upsertWebhookEventAction,
  deleteWebhookAction,
  listSignalsAction,
  listSubscribedVehiclesAction,
  listVehicleSubscriptionsAction,
  subscribeVehicleAction,
  subscribeAllVehiclesAction,
  unsubscribeVehicleAction,
  unsubscribeAllVehiclesAction,
]
