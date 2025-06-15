import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { attestationApiAction, deviceDefinitionApiAction, deviceDefinitionsSearchAction, generateDeveloperTokenAction, identityApiAction, telemetryApiAction, tokenExchangeApiAction, vehicleEventsUnifiedAction } from "./lib/actions";
import { batteryChargingTrigger, batteryPowerTrigger, chargeLevelTrigger, fuelAbsoluteTrigger, fuelRelativeTrigger, ignitionTrigger, odometerTrigger, speedTrigger, tirePressureTrigger } from "./lib/triggers";

export const dimo = createPiece({
  displayName: "DIMO",
  description : "The DIMO Network enables vehicles to be part of a protocol where users have digital ownership over their vehicle data (as an asset) and have the ability to earn rewards when sharing that data with a service provider",
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.0.1',
  logoUrl: "https://cdn.activepieces.com/pieces/dimo.png",
  authors: ["yusuf-cirak"],
  actions: [
    attestationApiAction,
    generateDeveloperTokenAction,
    deviceDefinitionApiAction,
    deviceDefinitionsSearchAction,
    identityApiAction,
    telemetryApiAction,
    tokenExchangeApiAction,
    vehicleEventsUnifiedAction,
  ],
  triggers: [batteryChargingTrigger,batteryPowerTrigger,chargeLevelTrigger,fuelAbsoluteTrigger,fuelRelativeTrigger,ignitionTrigger, odometerTrigger,speedTrigger,tirePressureTrigger],
});
