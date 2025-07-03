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
    developerJwt: PieceAuth.SecretText({
      displayName: 'Developer JWT', 
      description: 'JWT token for API access. Generate in DIMO Console: console.dimo.org > Webhooks > Generate developer JWT',
      required: true,
    }),
  },
  required: true,
  validate: async ({ auth }) => {
    // Developer JWT is required as primary authentication
    if (!auth.developerJwt) {
      return {
        valid: false,
        error: 'Developer JWT is required. Generate one at console.dimo.org > Webhooks > Generate developer JWT',
      };
    }
    
    return {
      valid: true,
    };
  },
});

    export const dimo = createPiece({
  displayName: "DIMO",
  description: "DIMO is an open-source connected vehicle protocol built on blockchain technology. Use 'Token Exchange API' to get Vehicle JWTs for specific operations.",
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
    