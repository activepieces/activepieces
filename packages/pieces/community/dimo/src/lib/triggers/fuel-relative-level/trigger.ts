import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { HttpError } from '@activepieces/pieces-common';
import { dimoAuth } from '../../../index';
import { WebhookHandshakeStrategy } from '@activepieces/shared';
import { DimoClient, getNumberExpression } from '../../common/helpers';
import { CreateWebhookParams, WebhookInfo, WebhookPayload } from '../../common/types';
import { TriggerField } from '../../common/constants';
import { operatorStaticDropdown, verificationTokenInput } from '../../common/props';

const TRIGGER_KEY = 'dimo-fuel-relative-level-trigger';

export const fuelRelativeTrigger = createTrigger({
	auth: dimoAuth,
	name: 'fuel-relative-level-trigger',
	displayName: 'Fuel System Relative Level Trigger',
	description: 'Triggers when vehicle fuel system relative level meets the specified condition.',
	type: TriggerStrategy.WEBHOOK,

	props: {
		vehicleTokenIds: Property.Array({
			displayName: 'Vehicle Token IDs',
			description:
				'List of vehicle token IDs to monitor (leave empty or select All Vehicles to monitor all vehicles with permissions).',
			required: false,
		}),
		operator: operatorStaticDropdown,
		fuelPercentage: Property.Number({
			displayName: 'Fuel Level (%)',
			description: 'The fuel level as a percentage (0-100) to compare against.',
			required: true,
		}),
		coolDownPeriod: Property.Number({
			displayName: 'Cool Down Period (seconds)',
			description: 'Minimum number of seconds between successive webhook firings',
			required: true,
			defaultValue: 30,
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
		const { clientId, apiKey, redirectUri } = context.auth.props;

		const { vehicleTokenIds, operator, fuelPercentage, coolDownPeriod, verificationToken } =
			context.propsValue;
		if (fuelPercentage < 0 || fuelPercentage > 100) {
			throw new Error('Fuel percentage must be between 0 and 100');
		}
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
			service: 'telemetry.signals',
			metricName: TriggerField.PowertrainFuelSystemRelativeLevel,
			condition: getNumberExpression(operator, fuelPercentage),
			coolDownPeriod,
			description: `Fuel relative level trigger: ${operator} ${fuelPercentage}%`,
			targetURL: context.webhookUrl,
			status: 'enabled',
			verificationToken: verificationToken,
		};
		try {
			const developerJwt = await dimo.getDeveloperJwt();
			const createWebhookResponse = await dimo.createWebhook({
				developerJwt,
				params: webhookPayload,
			});

			const webhookId = createWebhookResponse.id;

			await dimo.subscribeVehiclesToWebhook({
				developerJwt,
				webhookId,
				vehicleTokenIds: ids,
			});

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
		const { clientId, apiKey, redirectUri } = context.auth.props;
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
			webhookBody.name !== TriggerField.PowertrainFuelSystemRelativeLevel
		) {
			return [];
		}
		const fuelPercentage = webhookBody.valueNumber;

		// Return the webhook data
		return [
			{
				vehicleTokenId: webhookBody.tokenId,
				timestamp: webhookBody.timestamp,
				signal: webhookBody.name,
				fuelPercentage: fuelPercentage,
				rawValue: webhookBody.valueNumber,
				source: webhookBody.source,
				producer: webhookBody.producer,
				eventId: webhookBody.cloudEventId,
				triggerInfo: {
					conditionMet: true,
					operator: context.propsValue.operator,
					threshold: context.propsValue.fuelPercentage,
					actualValue: fuelPercentage,
					unit: '%',
				},
			},
		];
	},
	sampleData: {
		vehicleTokenId: 17,
		timestamp: '2025-05-07T22:50:23Z',
		signal: 'powertrainFuelSystemRelativeLevel',
		fuelPercentage: 25.8,
		rawValue: 25.8,
		source: '0xF26421509Efe92861a587482100c6d728aBf1CD0',
		producer: 'did:nft:137:0x9c94C395cBcBDe662235E0A9d3bB87Ad708561BA_31700',
		eventId: '2wmskfxoQk8r4chUZCat7tSnJLN',
		triggerInfo: {
			conditionMet: true,
			operator: 'less_than',
			threshold: 30,
			actualValue: 25.8,
			unit: '%',
		},
	},
});
