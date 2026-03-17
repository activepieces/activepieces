# DIMO Piece for Activepieces

[DIMO](https://www.dimo.org) is an open-source connected vehicle protocol built on blockchain. This Activepieces piece enables developers to integrate vehicle data, manage permissions, and build automation workflows using DIMO's comprehensive vehicle API ecosystem.

## Features

### 🔌 Actions

#### Token Exchange API (Developer JWT)
- **Exchange Token for Vehicle JWT** - Exchange a Developer JWT for a Vehicle JWT to access vehicle-specific data
- **List Shared Vehicles** - List vehicles that have shared permissions with your developer license

#### Attestation API (Vehicle JWT)
- **Create VIN Verifiable Credential** - Generate a VIN VC for on-chain verification (requires privilege 5)
- **Create Odometer Statement Verifiable Credential** - Generate an odometer attestation (requires privilege 4)
- **Create Vehicle Health Verifiable Credential** - Generate a vehicle health VC for a date range (requires privilege 4)

#### Device Definitions API (Developer JWT)
- **Search Device Definitions** - Search for vehicle definitions by make, model, year, or query
- **Get Device Definition by ID** - Retrieve a specific vehicle definition
- **Decode VIN** - Decode a Vehicle Identification Number to get vehicle details

#### Identity API (No Authentication Required)
- **Count DIMO Vehicles** - Get total vehicles on the DIMO network
- **Get Vehicles by Owner** - Get vehicles owned by a wallet address
- **Get Vehicle by Token ID** - Get detailed vehicle identity information
- **Custom GraphQL Query** - Execute custom queries against the Identity API

#### Telemetry API (Vehicle JWT)
- **Get Available Signals** - Look up all available telemetry signals for a vehicle
- **Get Latest Vehicle Signals** - Retrieve current signal values
- **Get Historical Vehicle Signals** - Query historical data for a time range
- **Custom GraphQL Query** - Execute custom queries against the Telemetry API

#### Webhooks API (Developer JWT)
- **List Webhooks** - View all configured webhooks
- **Create Webhook** - Create a new signal-based webhook
- **Delete Webhook** - Remove a webhook
- **Subscribe Vehicle to Webhook** - Add a specific vehicle to a webhook
- **Get Available Signal Names** - List all signals available for webhooks

---

### ⏱️ Triggers (Webhooks)

All triggers automatically create DIMO webhooks via the Vehicle Triggers API and clean up on disable.

| Trigger | Signal | Conditions |
|---------|--------|------------|
| **Vehicle Speed Alert** | `speed` | Equal to / Greater than / Less than (km/h) |
| **Vehicle Ignition Status Changed** | `isIgnitionOn` | ON / OFF |
| **Vehicle Odometer Alert** | `powertrainTransmissionTravelledDistance` | Equal to / Greater than / Less than (km) |
| **Vehicle Fuel Level Alert** | `powertrainFuelSystemRelativeLevel` / `powertrainFuelSystemAbsoluteLevel` | Equal to / Greater than / Less than |
| **Battery Current Power Alert** | `powertrainTractionBatteryCurrentPower` | Equal to / Greater than / Less than (W) |
| **Battery Charging Status Changed** | `powertrainTractionBatteryChargingIsCharging` | Charging Started / Charging Stopped |
| **Battery Charge Level Alert** | `powertrainTractionBatteryStateOfChargeCurrent` | Equal to / Greater than / Less than (%) |
| **Tire Pressure Alert** | `chassis*TirePressure` (4 tires) | Equal to / Greater than / Less than (kPa) |

---

## Authentication

DIMO uses a two-tier authentication system:

### Developer JWT
Required for most API calls. Obtained via the DIMO auth flow using your Developer License credentials.

**How to get a Developer JWT:**
1. Register at [DIMO Developer Console](https://console.dimo.org/)
2. Create a Developer License
3. Generate an API Key
4. Use the [DIMO Data SDK](https://github.com/DIMO-Network/data-sdk) to authenticate:

```typescript
import { DIMO } from '@dimo-network/data-sdk';
const dimo = new DIMO('Production');
const developerJwt = await dimo.auth.getDeveloperJwt({
  client_id: '<your_client_id>',
  domain: '<your_redirect_uri>',
  private_key: '<your_api_key>',
});
// Use developerJwt.access_token in the piece auth
```

### Vehicle JWT
Required for vehicle-specific data access (Attestation API, Telemetry API).

**How to get a Vehicle JWT:**
Vehicle owners must first share their vehicle via the DIMO Mobile App or [Login with DIMO](https://docs.dimo.org/developer-platform/getting-started/developer-guide/login-with-dimo). Then:

```typescript
const vehicleJwt = await dimo.tokenexchange.exchange({
  ...developerJwt,
  privileges: [1, 4, 5],
  tokenId: <vehicle_token_id>
});
// Use vehicleJwt.access_token in the piece auth
```

### Privilege IDs
- **1**: Non-location vehicle data (required for telemetry)
- **3**: Current location data
- **4**: All-time location + odometer/health attestations
- **5**: VIN credential access

---

## API Endpoints

| API | Base URL |
|-----|---------|
| Auth | `https://auth.dimo.zone` |
| Attestation | `https://attestation-api.dimo.zone` |
| Device Definitions | `https://device-definitions-api.dimo.zone` |
| Identity (GraphQL) | `https://identity-api.dimo.zone/query` |
| Telemetry (GraphQL) | `https://telemetry-api.dimo.zone/query` |
| Token Exchange | `https://token-exchange-api.dimo.zone` |
| Vehicle Triggers | `https://vehicle-triggers-api.dimo.zone` |

---

## Resources

- [DIMO Developer Docs](https://docs.dimo.org/developer-platform)
- [DIMO Developer Console](https://console.dimo.org/)
- [Identity API Playground](https://identity-api.dimo.zone/)
- [Telemetry API Playground](https://telemetry-api.dimo.zone/)
- [DIMO Data SDK](https://github.com/DIMO-Network/data-sdk)
- [DIMO Discord](https://discord.gg/dimonetwork) - Get support & share test vehicles

---

## Notes

- Webhooks API is currently in **beta**
- Webhooks are automatically subscribed to all vehicles with permissions when "Subscribe All Vehicles" is enabled
- Cool down periods prevent webhook spam; adjust based on your use case
- Vehicle JWTs are short-lived; refresh them before they expire
- Test vehicles can be obtained by joining the DIMO Discord and sharing with the community
