import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { attestationApiAction, deviceDefinitionApiAction, deviceDefinitionsSearchAction, generateDeveloperTokenAction, identityApiActions, telemetryApiActions, tokenExchangeApiAction, vehicleEventsUnifiedAction } from "./lib/actions";
import { batteryChargingTrigger, batteryPowerTrigger, chargeLevelTrigger, fuelAbsoluteTrigger, fuelRelativeTrigger, ignitionTrigger, odometerTrigger, speedTrigger, tirePressureTrigger } from "./lib/triggers";

export const dimoAuth = PieceAuth.CustomAuth({
  required: true,
  props: {
    developerJwt: PieceAuth.SecretText({
      displayName: "Developer JWT",
      description: "Your developer JWT. Generate using 'generate-developer-token-auth-api' action or get it from your license details page at DIMO Developer Console.",
      required: true,
    })
  },
});

const imageUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAcCAMAAABF0y+mAAAAMFBMVEVHcEzqAwPqBAToBAToAwPoBATkBgboAwPoAwPoAwPoAwPoAwPoAwPoAwPoAwPoAwMP6WyHAAAAD3RSTlMANB9o91MGzuW4hRiTRqQFftPIAAAAm0lEQVQokaWS2xbEEAxFo+Laqv//22Eixmh46X6ybOrkrAK8wgTMDPqg7U+dLo/Uc1d3mJ+gIukEVzDVJdnlXO+GlcQSy9NKM7E/U1LRQg+DJU5oYXh+zq8lCYY2b1ECXfWypFAoyzafLP3mswdtOlG2HiLYL6Oy3OgBaiJdXJDj+iTURkZYyxvWMsJSuvYLPY2/VW9j4vybecMHgnQY5Vpboz4AAAAASUVORK5CYII=";


export const dimo = createPiece({
  displayName: "DIMO",
  description: "The DIMO Network enables vehicles to be part of a protocol where users have digital ownership over their vehicle data (as an asset) and have the ability to earn rewards when sharing that data with a service provider",
  auth: dimoAuth,
  minimumSupportedRelease: '0.0.1',
  logoUrl: imageUrl,
  authors: ["yusuf-cirak"],
  actions: [
    attestationApiAction,
    generateDeveloperTokenAction,
    deviceDefinitionApiAction,
    deviceDefinitionsSearchAction,
    tokenExchangeApiAction,
    vehicleEventsUnifiedAction,
    ...identityApiActions,
    ...telemetryApiActions
  ],
  triggers: [batteryChargingTrigger,batteryPowerTrigger,chargeLevelTrigger,fuelAbsoluteTrigger,fuelRelativeTrigger,ignitionTrigger, odometerTrigger,speedTrigger,tirePressureTrigger],
});
