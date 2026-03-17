import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';

// Auth
import { dimoDeveloperAuth } from './lib/common/auth';

// Actions - Token Exchange
import { dimoTokenExchange, dimoListVehicleTokens } from './lib/actions/token-exchange';

// Actions - Attestation
import {
  dimoCreateVinVC,
  dimoCreateOdometerStatementVC,
  dimoCreateVehicleHealthVC,
} from './lib/actions/attestation';

// Actions - Device Definitions
import {
  dimoSearchDeviceDefinitions,
  dimoGetDeviceDefinitionById,
  dimoDecodeVin,
} from './lib/actions/device-definitions';

// Actions - Identity
import {
  dimoCountVehicles,
  dimoGetVehiclesByOwner,
  dimoGetVehicleById,
  dimoIdentityCustomQuery,
} from './lib/actions/identity';

// Actions - Telemetry
import {
  dimoGetAvailableSignals,
  dimoGetLatestVehicleSignals,
  dimoGetHistoricalSignals,
  dimoTelemetryCustomQuery,
} from './lib/actions/telemetry';

// Actions - Webhooks Management
import {
  dimoListWebhooks,
  dimoCreateWebhook,
  dimoDeleteWebhook,
  dimoSubscribeVehicleToWebhook,
  dimoGetWebhookSignalNames,
} from './lib/actions/webhooks';

// Triggers
import { dimoSpeedTrigger } from './lib/triggers/speed-trigger';
import { dimoIgnitionTrigger } from './lib/triggers/ignition-trigger';
import { dimoOdometerTrigger } from './lib/triggers/odometer-trigger';
import { dimoFuelLevelTrigger } from './lib/triggers/fuel-trigger';
import {
  dimoBatteryPowerTrigger,
  dimoBatteryChargingTrigger,
} from './lib/triggers/battery-trigger';
import { dimoChargeLevelTrigger } from './lib/triggers/charge-level-trigger';
import { dimoTirePressureTrigger } from './lib/triggers/tire-pressure-trigger';

export const dimo = createPiece({
  displayName: 'DIMO',
  description:
    'DIMO is an open-source connected vehicle protocol built on blockchain. Access vehicle telemetry, identity data, and manage vehicle permissions for connected cars worldwide.',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/dimo.png',
  categories: [PieceCategory.COMMERCE, PieceCategory.DEVELOPER_TOOLS],
  auth: dimoDeveloperAuth,
  authors: [],
  actions: [
    // Token Exchange
    dimoTokenExchange,
    dimoListVehicleTokens,

    // Attestation API (Vehicle JWT)
    dimoCreateVinVC,
    dimoCreateOdometerStatementVC,
    dimoCreateVehicleHealthVC,

    // Device Definitions API (Developer JWT)
    dimoSearchDeviceDefinitions,
    dimoGetDeviceDefinitionById,
    dimoDecodeVin,

    // Identity API (No Auth)
    dimoCountVehicles,
    dimoGetVehiclesByOwner,
    dimoGetVehicleById,
    dimoIdentityCustomQuery,

    // Telemetry API (Vehicle JWT)
    dimoGetAvailableSignals,
    dimoGetLatestVehicleSignals,
    dimoGetHistoricalSignals,
    dimoTelemetryCustomQuery,

    // Webhooks API (Developer JWT)
    dimoListWebhooks,
    dimoCreateWebhook,
    dimoDeleteWebhook,
    dimoSubscribeVehicleToWebhook,
    dimoGetWebhookSignalNames,
  ],
  triggers: [
    dimoSpeedTrigger,
    dimoIgnitionTrigger,
    dimoOdometerTrigger,
    dimoFuelLevelTrigger,
    dimoBatteryPowerTrigger,
    dimoBatteryChargingTrigger,
    dimoChargeLevelTrigger,
    dimoTirePressureTrigger,
  ],
});
