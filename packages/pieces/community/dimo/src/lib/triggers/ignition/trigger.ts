import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { HttpError } from '@activepieces/pieces-common';
import { dimoAuth } from '../../../index';
import { WebhookHandshakeStrategy } from '@activepieces/shared';
import { DimoClient, getBooleanExpression } from '../../common/helpers';
import {
	CreateWebhookParams,
	WebhookInfo,
	WebhookPayload,
} from '../../common/types';
import { TriggerField } from '../../common/constants';
import { verificationTokenInput } from '../../common/props';

const TRIGGER_KEY = 'dimo-ignition-trigger';

export const ignitionTrigger = createTrigger({
	auth: dimoAuth,
	name: 'ignition-trigger',
	displayName: 'Ignition Status Trigger',
	description: 'Triggers when vehicle ignition status changes (ON/OFF).',
	type: TriggerStrategy.WEBHOOK,
	props: {
		vehicleTokenIds: Property.Array({
			displayName: 'Vehicle Token IDs',
			description:
				'List of vehicle token IDs to monitor (leave empty to monitor all vehicles with permissions).',
			required: false,
		}),
		ignitionState: Property.StaticDropdown({
			displayName: 'Ignition State',
			description: 'Trigger when ignition turns ON or OFF.',
			required: true,
			defaultValue: 'on',
			options: {
				options: [
					{ label: 'ON (ignition turned on)', value: 'on' },
					{ label: 'OFF (ignition turned off)', value: 'off' },
				],
			},
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

		const { vehicleTokenIds, ignitionState, coolDownPeriod, verificationToken } =
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
			metricName: TriggerField.IsIgnitionOn,
			condition: getBooleanExpression(ignitionState.toLowerCase() === 'on'),
			coolDownPeriod,
			description: `Ignition trigger: ${ignitionState.toUpperCase()}`,
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
			webhookBody.name !== TriggerField.IsIgnitionOn
		) {
			return [];
		}

		const isIgnitionOn = webhookBody.valueNumber === 1;
		const ignitionStatus = isIgnitionOn ? 'ON' : 'OFF';

		// Return the webhook data
		return [
			{
				vehicleTokenId: webhookBody.tokenId,
				timestamp: webhookBody.timestamp,
				signal: webhookBody.name,
				ignitionStatus: ignitionStatus,
				isIgnitionOn: isIgnitionOn,
				rawValue: webhookBody.valueNumber,
				source: webhookBody.source,
				producer: webhookBody.producer,
				eventId: webhookBody.cloudEventId,
				triggerInfo: {
					conditionMet: true,
					actualState: ignitionStatus,
					configuredState: context.propsValue.ignitionState.toUpperCase(),
				},
			},
		];
	},
	sampleData: {
		vehicleTokenId: 17,
		timestamp: '2025-05-07T22:50:23Z',
		signal: 'isIgnitionOn',
		ignitionStatus: 'ON',
		isIgnitionOn: 1,
		rawValue: 1,
		source: '0xF26421509Efe92861a587482100c6d728aBf1CD0',
		producer: 'did:nft:137:0x9c94C395cBcBDe662235E0A9d3bB87Ad708561BA_31700',
		eventId: '2wmskfxoQk8r4chUZCat7tSnJLN',
		triggerInfo: {
			conditionMet: true,
			actualState: 'ON',
			configuredState: 'ON',
		},
	},
});
