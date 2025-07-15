import { createPiece, PieceAuth, Property } from '@activepieces/pieces-framework';
import {
	attestationApiActions,
	deviceDefinitionApiActions,
	identityApiActions,
	telemetryApiActions,
	tokenExchangeApiActions,
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
		'The DIMO Network enables vehicles to be part of a protocol where users have digital ownership over their vehicle data (as an asset) and have the ability to earn rewards when sharing that data with a service provider.',
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
