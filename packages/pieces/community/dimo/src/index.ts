import { createPiece, PieceAuth, Property } from '@activepieces/pieces-framework';
import {
	attestationApiActions,
	deviceDefinitionApiActions,
	identityApiActions,
	telemetryApiActions,
	tokenExchangeApiActions,
    vehicleEventsApiActions,
} from './lib/actions';
import {
	batteryChargingTrigger,
	batteryPowerTrigger,
	chargeLevelTrigger,
	fuelAbsoluteTrigger,
	fuelRelativeTrigger,
	ignitionTrigger,
	odometerTrigger,
	speedTrigger,
	tirePressureTrigger,
} from './lib/triggers';

export const dimoAuth = PieceAuth.CustomAuth({
	description: `You can obtain following credentials by creating Developer License at [Developer Console](https://console.dimo.org/).`,
	required: true,
	props: {
		clientId: Property.ShortText({
			displayName: 'Client ID',
			required: true,
		}),
		redirectUri: Property.ShortText({
			displayName: 'Redirect URI',
			required: true,
		}),
		apiKey: Property.ShortText({
			displayName: 'API Key',
			required: true,
		}),
	},
});

export const dimo = createPiece({
	displayName: 'DIMO',
	description:
		'DIMO is an open protocol using blockchain to establish universal digital vehicle identity, permissions, data transmission, vehicle control, and payments. Developers use DIMO to build apps based on connected vehicles around the world while the vehicle owners benefit from monetizing their vehicle data.',
	auth: dimoAuth,
	minimumSupportedRelease: '0.36.1',
	logoUrl: 'https://cdn.activepieces.com/pieces/dimo.png',
	authors: ['yusuf-cirak', 'kishanprmr'],
	actions: [
		...attestationApiActions,
		...deviceDefinitionApiActions,
		...tokenExchangeApiActions,
		...identityApiActions,
		...telemetryApiActions,
		...vehicleEventsApiActions,
	],
	triggers: [
		batteryChargingTrigger,
		batteryPowerTrigger,
		chargeLevelTrigger,
		fuelAbsoluteTrigger,
		fuelRelativeTrigger,
		ignitionTrigger,
		odometerTrigger,
		speedTrigger,
		tirePressureTrigger,
	],
});
