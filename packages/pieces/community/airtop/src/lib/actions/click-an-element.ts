import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { airtopAuth } from '../common/auth';
import { airtopApiCall } from '../common/client';
import { sessionId, windowId } from '../common/props';
import { propsValidation } from '@activepieces/pieces-common';
import { z } from 'zod';

export const clickAction = createAction({
	name: 'click',
	auth: airtopAuth,
	displayName: 'Click',
	description: 'Execute a click interaction in a specific browser window.',
	props: {
		sessionId: sessionId,
		windowId: windowId,
		elementDescription: Property.ShortText({
			displayName: 'Element Description',
			description: 'Describe the element to click (e.g. "Login button").',
			required: true,
		}),
		clickType: Property.StaticDropdown({
			displayName: 'Click Type',
			description: 'The type of click to perform.',
			required: false,
			defaultValue: 'click',
			options: {
				disabled: false,
				options: [
					{ label: 'Left Click', value: 'click' },
					{ label: 'Double Click', value: 'doubleClick' },
					{ label: 'Right Click', value: 'rightClick' },
				],
			},
		}),
		analysisScope: Property.StaticDropdown({
			displayName: 'Page Analysis Scope',
			description: 'Controls how much of the page is visually analyzed.',
			required: false,
			defaultValue: 'auto',
			options: {
				disabled: false,
				options: [
					{ label: 'Auto (Recommended)', value: 'auto' },
					{ label: 'Current View Only', value: 'viewport' },
					{ label: 'Full Page', value: 'page' },
					{ label: 'Scan Mode', value: 'scan' },
				],
			},
		}),
		waitForNavigation: Property.Checkbox({
			displayName: 'Wait for Navigation',
			description: 'Wait for page navigation to complete after clicking.',
			required: false,
			defaultValue: false,
		}),
		navigationWaitUntil: Property.StaticDropdown({
			displayName: 'Navigation Wait Until',
			description: 'When to consider navigation complete.',
			required: false,
			defaultValue: 'load',
			options: {
				disabled: false,
				options: [
					{ label: 'load', value: 'load' },
					{ label: 'domcontentloaded', value: 'domcontentloaded' },
					{ label: 'networkidle0', value: 'networkidle0' },
					{ label: 'networkidle2', value: 'networkidle2' },
				],
			},
		}),
		navigationTimeoutSeconds: Property.Number({
			displayName: 'Navigation Timeout (Seconds)',
			description: 'Max seconds to wait for navigation. Default is 30.',
			required: false,
		}),
		costThresholdCredits: Property.Number({
			displayName: 'Maximum Credits to Spend',
			description: 'Abort if the credit cost exceeds this amount. Set to 0 to disable.',
			required: false,
		}),
		timeThresholdSeconds: Property.Number({
			displayName: 'Maximum Time (Seconds)',
			description: 'Abort if the operation takes longer than this. Set to 0 to disable.',
			required: false,
		}),
		clientRequestId: Property.ShortText({
			displayName: 'Client Request ID',
			required: false,
		}),
	},
	async run(context) {
		const {
			sessionId,
			windowId,
			elementDescription,
			clickType,
			analysisScope,
			waitForNavigation,
			navigationTimeoutSeconds,
			navigationWaitUntil,
			costThresholdCredits,
			timeThresholdSeconds,
			clientRequestId,
		} = context.propsValue;

		await propsValidation.validateZod(context.propsValue, {
		costThresholdCredits: z.number().min(0).optional(),
		timeThresholdSeconds: z.number().min(0).optional(),
		navigationTimeoutSeconds: z.number().min(0).optional(),
	});

		const config: Record<string, any> = {};

		if (clickType) config['clickType'] = clickType;
		if (analysisScope) config['scope'] = analysisScope;

		if (waitForNavigation) {
			config['waitForNavigation'] = true;
			config['waitForNavigationConfig'] = {};
			if (navigationWaitUntil) config['waitForNavigationConfig'].waitUntil = navigationWaitUntil;
			if (navigationTimeoutSeconds) config['waitForNavigationConfig'].timeoutSeconds = navigationTimeoutSeconds;
		}

		if (typeof costThresholdCredits === 'number') config['costThresholdCredits'] = costThresholdCredits;
		if (typeof timeThresholdSeconds === 'number') config['timeThresholdSeconds'] = timeThresholdSeconds;

		const body: Record<string, any> = {
			elementDescription,
		};

		if (clientRequestId) body['clientRequestId'] = clientRequestId;
		if (Object.keys(config).length > 0) body['configuration'] = config;

		const response = await airtopApiCall({
			apiKey: context.auth,
			method: HttpMethod.POST,
			resourceUri: `/sessions/${sessionId}/windows/${windowId}/click`,
			body,
		});

		return response;
	},
});
