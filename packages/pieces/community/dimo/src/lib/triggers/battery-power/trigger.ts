import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { HttpError } from '@activepieces/pieces-common';
import { dimoAuth } from '../../../index';
import { DimoClient } from '../../common/helpers';
import { CreateWebhookParams, WebhookInfo, WebhookPayload } from '../../common/types';
import { TriggerField } from '../../common/constants';
import { operatorStaticDropdown, verificationTokenInput } from '../../common/props';
import { WebhookHandshakeStrategy } from '@activepieces/shared';

const TRIGGER_KEY = 'dimo-battery-power-trigger';

export const batteryPowerTrigger = createTrigger({
	auth: dimoAuth,
	name: 'battery-power-trigger',
	displayName: 'Battery Current Power Trigger',
	description: 'Triggers when vehicle battery current power meets the specified condition.',
	type: TriggerStrategy.WEBHOOK,
	props: {
		vehicleTokenIds: Property.Array({
			displayName: 'Vehicle Token IDs',
			description:
				'List of vehicle token IDs to monitor (leave empty to monitor all vehicles with permissions).',
			required: false,
		}),
		operator: operatorStaticDropdown,
		powerWatts: Property.Number({
			displayName: 'Battery Power (Watts)',
			description: 'The battery power in watts to compare against.',
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

		const { vehicleTokenIds, operator, powerWatts, triggerFrequency, verificationToken } =
			context.propsValue;
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
			data: TriggerField.PowertrainTractionBatteryCurrentPower,
			trigger: {
				field: TriggerField.PowertrainTractionBatteryCurrentPower,
				operator,
				value: powerWatts,
			},
			setup: triggerFrequency as 'Realtime' | 'Hourly',
			description: `Battery power trigger: ${operator} ${powerWatts}W`,
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

		if (
			!webhookBody ||
			typeof webhookBody !== 'object' ||
			webhookBody.name !== TriggerField.PowertrainTractionBatteryCurrentPower
		) {
			return [];
		}

		const powerWatts = webhookBody.valueNumber;
		const powerKw = Math.round((powerWatts / 1000) * 100) / 100; // Convert watts to kilowatts
		const isCharging = powerWatts < 0; // Negative power typically means charging
		const isDischarging = powerWatts > 0; // Positive power typically means discharging

		return [
			{
				vehicleTokenId: webhookBody.tokenId,
				timestamp: webhookBody.timestamp,
				signal: webhookBody.name,
				powerWatts: powerWatts,
				powerKw: powerKw,
				isCharging: isCharging,
				isDischarging: isDischarging,
				powerStatus: isCharging ? 'Charging' : isDischarging ? 'Discharging' : 'Idle',
				rawValue: webhookBody.valueNumber,
				source: webhookBody.source,
				producer: webhookBody.producer,
				eventId: webhookBody.cloudEventId,
				triggerInfo: {
					conditionMet: true,
					operator: context.propsValue.operator,
					threshold: context.propsValue.powerWatts,
					actualValue: powerWatts,
					unit: 'W',
				},
			},
		];
	},
	sampleData: {
		vehicleTokenId: 17,
		timestamp: '2025-05-07T22:50:23Z',
		signal: 'powertrainTractionBatteryCurrentPower',
		powerWatts: 154.5,
		powerKw: 1,
		isCharging: false,
		isDischarging: false,
		powerStatus: 'Charging',
		rawValue: 22,
		source: '0xF26421509Efe92861a587482100c6d728aBf1CD0',
		producer: 'did:nft:137:0x9c94C395cBcBDe662235E0A9d3bB87Ad708561BA_31700',
		eventId: '2wmskfxoQk8r4chUZCat7tSnJLN',
		triggerInfo: {
			conditionMet: true,
			operator: 'less_than',
			threshold: 1000,
			actualValue: 154.5,
			unit: 'W',
		},
	},
});
