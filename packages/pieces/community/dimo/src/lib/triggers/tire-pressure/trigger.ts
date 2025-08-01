import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { HttpError } from '@activepieces/pieces-common';
import { dimoAuth } from '../../../index';
import { WebhookHandshakeStrategy } from '@activepieces/shared';
import { DimoClient, getTirePressurePositionLabel } from '../../common/helpers';
import {
	CreateWebhookParams,
	NumericTriggerField,
	WebhookInfo,
	WebhookPayload,
} from '../../common/types';
import { TirePressurePosition, TriggerField } from '../../common/constants';
import { operatorStaticDropdown, verificationTokenInput } from '../../common/props';

const TRIGGER_KEY = 'dimo-tire-pressure-trigger';

export const tirePressureTrigger = createTrigger({
	auth: dimoAuth,
	name: 'tire-pressure-trigger',
	displayName: 'Tire Pressure Trigger',
	description: 'Triggers when vehicle tire pressure meets the specified condition.',
	type: TriggerStrategy.WEBHOOK,
	props: {
		vehicleTokenIds: Property.Array({
			displayName: 'Vehicle Token IDs',
			description:
				'List of vehicle token IDs to monitor (leave empty to monitor all vehicles with permissions).',
			required: false,
		}),
		tirePosition: Property.StaticDropdown({
			displayName: 'Tire Position',
			description: 'Which tire position to monitor',
			required: true,
			defaultValue: TriggerField.ChassisAxleRow1WheelLeftTirePressure,
			options: {
				options: [
					{ label: 'Front Left', value: TriggerField.ChassisAxleRow1WheelLeftTirePressure },
					{ label: 'Front Right', value: TriggerField.ChassisAxleRow1WheelRightTirePressure },
					{ label: 'Rear Left', value: TriggerField.ChassisAxleRow2WheelLeftTirePressure },
					{ label: 'Rear Right', value: TriggerField.ChassisAxleRow2WheelRightTirePressure },
				],
			},
		}),
		operator: operatorStaticDropdown,
		pressureKpa: Property.Number({
			displayName: 'Tire Pressure (kPa)',
			description: 'The tire pressure in kilopascals to compare against',
			required: true,
		}),
		triggerFrequency: Property.StaticDropdown({
			displayName: 'Trigger Frequency',
			description: 'How often the webhook should fire when condition is met.',
			required: true,
			defaultValue: 'Realtime',
			options: {
				options: [
					{ label: 'Real-time (continuous)', value: 'Realtime' },
					{ label: 'Hourly', value: 'Hourly' },
				],
			},
		}),
		verificationToken: verificationTokenInput,
	},
	handshakeConfiguration: {
		strategy: WebhookHandshakeStrategy.BODY_PARAM_PRESENT,
		paramName: 'verification',
	},
	async onHandshake(context) {
		return {
			body: context.propsValue.verificationToken,
			headers: {
				'Content-Type': 'text/plain',
			},
			status: 200,
		};
	},

	async onEnable(context) {
		const { clientId, apiKey, redirectUri } = context.auth;

		const {
			vehicleTokenIds,
			tirePosition,
			operator,
			pressureKpa,
			triggerFrequency,
			verificationToken,
		} = context.propsValue;

		const dimo = new DimoClient({
			clientId,
			apiKey,
			redirectUri,
		});

		const ids: string[] =
			vehicleTokenIds && Array.isArray(vehicleTokenIds) && vehicleTokenIds.length > 0
				? vehicleTokenIds.map(String)
				: [];

		const webhookPayload: CreateWebhookParams = {
			service: 'Telemetry',
			data: tirePosition,
			trigger: {
				field: tirePosition as NumericTriggerField,
				operator,
				value: pressureKpa,
			},
			setup: triggerFrequency as 'Realtime' | 'Hourly',
			description: `Tire pressure trigger: ${getTirePressurePositionLabel(
				tirePosition,
			)} ${operator} ${pressureKpa} kPa`,
			target_uri: context.webhookUrl,
			status: 'Active',
			verification_token: verificationToken,
		};

		try {
			const developerJwt = await dimo.getDeveloperJwt();
			const createWebhookResponse = await dimo.createWebhook({
				developerJwt,
				params: webhookPayload,
			});

			const webhookId = createWebhookResponse.id;

			if (ids.length === 0) {
				await dimo.subscribeAllVehicles({
					developerJwt,
					webhookId,
				});
			} else {
				await Promise.all(
					ids.map(async (tokenId) => {
						await dimo.subscribeVehicle({ developerJwt, tokenId, webhookId });
					}),
				);
			}
			await context.store.put<WebhookInfo>(TRIGGER_KEY, {
				webhookId,
				verificationToken,
			});
		} catch (err) {
			const message = (err as HttpError).message;
			throw new Error(message);
		}
	},

	async onDisable(context) {
		const { clientId, apiKey, redirectUri } = context.auth;
		const dimo = new DimoClient({
			clientId,
			apiKey,
			redirectUri,
		});
		const webhookInfo = await context.store.get<WebhookInfo>(TRIGGER_KEY);
		if (webhookInfo) {
			try {
				const developerJwt = await dimo.getDeveloperJwt();

				const webhookId = webhookInfo.webhookId;

				await dimo.unsubscribeAllVehicles({ developerJwt, webhookId });
				await dimo.deleteWebhook({ developerJwt, webhookId });
			} catch (err) {
				const message = (err as HttpError).message;
				throw new Error(message);
			}
		}
	},
	async run(context) {
		const webhookBody = context.payload.body as WebhookPayload;

		// Validate webhook payload structure
		if (!webhookBody || typeof webhookBody !== 'object') {
			return [];
		}

		// Verify this is a tire pressure event
		const validTireSignals = [
			TirePressurePosition.FRONT_LEFT,
			TirePressurePosition.FRONT_RIGHT,
			TirePressurePosition.REAR_LEFT,
			TirePressurePosition.REAR_RIGHT,
		];

		if (!validTireSignals.includes(webhookBody.name as TirePressurePosition)) {
			return [];
		}

		const pressureKpa = webhookBody.valueNumber;
		const pressurePsi = Math.round(pressureKpa * 0.145038 * 100) / 100; // Convert kPa to PSI
		const pressureBar = Math.round(pressureKpa * 0.01 * 100) / 100; // Convert kPa to bar

		// Determine tire position and status
		const tirePosition = webhookBody.name as TriggerField;
		const positionLabel = getTirePressurePositionLabel(tirePosition);

		// Standard tire pressure ranges (rough estimates)
		const isLowPressure = pressureKpa < 180; // < ~26 PSI
		const isHighPressure = pressureKpa > 280; // > ~40 PSI
		const pressureStatus = isLowPressure ? 'Low' : isHighPressure ? 'High' : 'Normal';

		// Return the webhook data
		return [
			{
				vehicleTokenId: webhookBody.tokenId,
				timestamp: webhookBody.timestamp,
				signal: webhookBody.name,
				tirePosition: positionLabel,
				pressureKpa: pressureKpa,
				pressurePsi: pressurePsi,
				pressureBar: pressureBar,
				pressureStatus: pressureStatus,
				isLowPressure: isLowPressure,
				isHighPressure: isHighPressure,
				rawValue: webhookBody.valueNumber,
				source: webhookBody.source,
				producer: webhookBody.producer,
				eventId: webhookBody.cloudEventId,
				triggerInfo: {
					conditionMet: true,
					operator: context.propsValue.operator,
					threshold: context.propsValue.pressureKpa,
					actualValue: pressureKpa,
					unit: 'kPa',
					monitoredPosition: positionLabel,
				},
			},
		];
	},
	sampleData: {
		vehicleTokenId: 17,
		timestamp: '2025-05-07T22:50:23Z',
		signal: 'chassisAxleRow1WheelLeftTirePressure',
		tirePosition: 'Rear Right',
		pressureKpa: 134,
		pressurePsi: 19.43,
		pressureBar: 1.34,
		pressureStatus: true,
		isHighPressure: false,
		rawValue: 134,
		source: '0xF26421509Efe92861a587482100c6d728aBf1CD0',
		producer: 'did:nft:137:0x9c94C395cBcBDe662235E0A9d3bB87Ad708561BA_31700',
		eventId: '2wmskfxoQk8r4chUZCat7tSnJLN',
		triggerInfo: {
			conditionMet: true,
			operator: 'less_than',
			threshold: 200,
			actualValue: 134,
			unit: 'kPa',
			monitoredPosition: 'Rear Right',
		},
	},
});
