# PR: Add DIMO Piece

**Closes #8018**

## Summary

This PR adds a new community piece for [DIMO](https://www.dimo.org) — an open-source connected vehicle protocol built on blockchain. The piece enables Activepieces users to integrate vehicle telemetry data, manage vehicle permissions, and set up automated triggers for vehicle events.

## Changes

New piece: `packages/pieces/community/dimo/`

### Actions (21 total)

**Token Exchange API** (Developer JWT)
- Exchange Token for Vehicle JWT
- List Shared Vehicles

**Attestation API** (Vehicle JWT)
- Create VIN Verifiable Credential
- Create Odometer Statement VC
- Create Vehicle Health VC

**Device Definitions API** (Developer JWT)
- Search Device Definitions
- Get Device Definition by ID
- Decode VIN

**Identity API** (No Auth)
- Count DIMO Vehicles
- Get Vehicles by Owner
- Get Vehicle by Token ID
- Custom GraphQL Query

**Telemetry API** (Vehicle JWT)
- Get Available Signals for Vehicle
- Get Latest Vehicle Signals
- Get Historical Vehicle Signals
- Custom GraphQL Query

**Webhooks API** (Developer JWT)
- List Webhooks
- Create Webhook
- Delete Webhook
- Subscribe Vehicle to Webhook
- Get Available Webhook Signal Names

### Triggers (8 total)

All triggers use `TriggerStrategy.WEBHOOK` and automatically manage DIMO webhook lifecycle (create on enable, delete on disable).

| Trigger | Signal | Conditions |
|---------|--------|------------|
| Vehicle Speed Alert | `speed` | Equal to / Greater than / Less than |
| Ignition Status Changed | `isIgnitionOn` | ON / OFF |
| Odometer Alert | `powertrainTransmissionTravelledDistance` | Equal to / Greater than / Less than |
| Fuel Level Alert | `powertrainFuelSystemRelativeLevel/Absolute` | Equal to / Greater than / Less than |
| Battery Power Alert | `powertrainTractionBatteryCurrentPower` | Equal to / Greater than / Less than |
| Battery Charging Status | `powertrainTractionBatteryChargingIsCharging` | Charging Started / Stopped |
| Battery Charge Level | `powertrainTractionBatteryStateOfChargeCurrent` | Equal to / Greater than / Less than |
| Tire Pressure Alert | All 4 tire signals | Equal to / Greater than / Less than |

## Authentication

DIMO uses a two-tier JWT system. The piece uses `PieceAuth.CustomAuth` with fields for:
- **Developer JWT**: For API calls requiring developer authorization
- **Vehicle JWT**: For vehicle-specific data access (Telemetry, Attestation)
- **Client ID**: For Token Exchange operations

## Notes

- Webhooks API is in beta per DIMO documentation
- No new external dependencies required (uses `@activepieces/pieces-common` `httpClient`)
- All GraphQL APIs (Identity, Telemetry) include custom query actions for flexibility
- DIMO logo URL pending - placeholder used

## Testing

To test this piece you'll need to:
1. Register as a licensed developer at https://console.dimo.org/
2. Generate a Developer JWT using the DIMO Data SDK
3. Join the DIMO Discord to get test vehicles shared with your license
