import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { HttpError } from '@activepieces/pieces-common';
import { dimoAuth } from '../../../index';
import { WebhookHandshakeStrategy } from '@activepieces/shared';
import { DimoClient, getNumberExpression } from '../../common/helpers';
import { CreateWebhookParams, WebhookInfo, WebhookPayload } from '../../common/types';
import { TriggerField } from '../../common/constants';
import { operatorStaticDropdown, verificationTokenInput } from '../../common/props';

const TRIGGER_KEY = 'dimo-speed-trigger';

export const speedTrigger = createTrigger({
	auth: dimoAuth,
	name: 'speed-trigger',
	displayName: 'Speed Trigger',
	description: 'Triggers when vehicle speed meets specified conditions.',
	type: TriggerStrategy.WEBHOOK,

	props: {
		vehicleTokenIds: Property.Array({
			displayName: 'Vehicle Token IDs',
			description:
				'List of vehicle token IDs to monitor (leave empty to monitor all vehicles with permissions).',
			required: false,
		}),
		operator: operatorStaticDropdown,
		speedValue: Property.Number({
			displayName: 'Speed Value (km/h)',
			description: 'Speed value to compare against in kilometers per hour',
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

		const { vehicleTokenIds, operator, speedValue, coolDownPeriod, verificationToken } =
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
			service: 'telemetry.signals',
			metricName: TriggerField.Speed,
			condition: getNumberExpression(operator, speedValue),
			coolDownPeriod,
			description: `Speed trigger: ${operator} ${speedValue} km/h`,
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
			webhookBody.name !== TriggerField.Speed
		) {
			return [];
		}

		return [
			{
				...webhookBody,
				triggerInfo: {
					conditionMet: true,
					actualValue: webhookBody.valueNumber,
					configuredOperator: context.propsValue.operator,
					configuredValue: context.propsValue.speedValue,
				},
			},
		];
	},
	sampleData: {
		tokenId: 17,
		timestamp: '2025-05-07T22:50:23Z',
		name: 'speed',
		valueNumber: 65.5,
		valueString: '',
		source: '0xF26421509Efe92861a587482100c6d728aBf1CD0',
		producer: 'did:nft:137:0x9c94C395cBcBDe662235E0A9d3bB87Ad708561BA_31700',
		cloudEventId: '2wmskfxoQk8r4chUZCat7tSnJLN',
		triggerInfo: {
			conditionMet: true,
			actualValue: 65.5,
			configuredOperator: 'less_than',
			configuredValue: 80,
		},
	},
});
