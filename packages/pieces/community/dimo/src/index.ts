import { createPiece, PieceAuth, Property } from "@activepieces/pieces-framework";
import { PieceCategory } from "@activepieces/shared";

// Import actions
import { attestationApiAction } from "./lib/actions/attestation-api";
import { deviceDefinitionApiAction } from "./lib/actions/device-definition-api";
import { tokenExchangeApiAction } from "./lib/actions/token-exchange-api";
import { identityApiAction } from "./lib/actions/identity-api";
import { customApiCallAction } from "./lib/actions/custom-api-call";
import { telemetryApiAction } from "./lib/actions/telemetry-api";
import { vehicleDataFieldsAction } from "./lib/actions/vehicle-data-fields";
import { webhooksApiAction } from "./lib/actions/webhooks-api";

// Import triggers
import { speedTrigger } from "./lib/triggers/speed-trigger";
import { ignitionTrigger } from "./lib/triggers/ignition-trigger";
import { odometerTrigger } from "./lib/triggers/odometer-trigger";
import { fuelRelativeTrigger } from "./lib/triggers/fuel-relative-trigger";
import { fuelAbsoluteTrigger } from "./lib/triggers/fuel-absolute-trigger";
import { batteryPowerTrigger } from "./lib/triggers/battery-power-trigger";
import { batteryChargingTrigger } from "./lib/triggers/battery-charging-trigger";
import { chargeLevelTrigger } from "./lib/triggers/charge-level-trigger";
import { tirePressureTrigger } from "./lib/triggers/tire-pressure-trigger";

export const dimoAuth = PieceAuth.CustomAuth({
  props: {
    baseUrl: Property.ShortText({
      displayName: 'Base URL',
      description: 'DIMO API base URL',
      required: true,
      defaultValue: 'https://api.dimo.zone',
    }),
    vehicleJwt: PieceAuth.SecretText({
      displayName: 'Vehicle JWT',
      description: 'JWT token for vehicle-specific operations (Attestation, Telemetry, etc.)',
      required: false,
    }),
    developerJwt: PieceAuth.SecretText({
      displayName: 'Developer JWT', 
      description: 'JWT token for developer operations (Device Definition, Token Exchange, Webhooks)',
      required: false,
    }),
  },
  required: true,
  validate: async ({ auth }) => {
    // Validate at least one JWT is provided
    if (!auth.vehicleJwt && !auth.developerJwt) {
      return {
        valid: false,
        error: 'At least one JWT token (Vehicle JWT or Developer JWT) is required',
      };
    }
    
    // Validate base URL format
    if (!auth.baseUrl.match(/^https?:\/\//)) {
      return {
        valid: false,
        error: 'Base URL must be a valid HTTP or HTTPS URL',
      };
    }
    
    return {
      valid: true,
    };
  },
});

    export const dimo = createPiece({
  displayName: "DIMO",
  description: "DIMO is an open-source connected vehicle protocol built on blockchain technology",
  auth: dimoAuth,
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/dimo.png",
  authors: ["onyedikachi-david"],
  actions: [
    attestationApiAction,
    deviceDefinitionApiAction,
    tokenExchangeApiAction,
    identityApiAction,
    customApiCallAction,
    telemetryApiAction,
    vehicleDataFieldsAction,
    webhooksApiAction,
  ],
  triggers: [
    speedTrigger,
    ignitionTrigger,
    odometerTrigger,
    fuelRelativeTrigger,
    fuelAbsoluteTrigger,
    batteryPowerTrigger,
    batteryChargingTrigger,
    chargeLevelTrigger,
    tirePressureTrigger,
  ],
    });
    