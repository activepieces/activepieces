import { HttpMethod, propsValidation } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { airtopAuth } from '../common/auth';
import { airtopApiCall } from '../common/client';
import { sessionId } from '../common/props';
import { z } from 'zod';

export const createNewBrowserWindowAction = createAction({
	name: 'create-browser-window',
	auth: airtopAuth,
	displayName: 'Create New Browser Window',
	description: 'Opens a new window within a session, optionally navigating to a URL.',
	props: {
		sessionId: sessionId,
		url: Property.ShortText({
			displayName: 'Initial URL',
			description: 'URL to open in the new window. Default: https://www.google.com',
			required: false,
		}),
		screenResolution: Property.StaticDropdown({
			displayName: 'Screen Resolution',
			description: 'Fixed dimensions for the browser window. Affects live view size.',
			required: false,
			defaultValue: '1280x720',
			options: {
				options: [
					{ label: '1280x720 (Default)', value: '1280x720' },
					{ label: '1920x1080', value: '1920x1080' },
					{ label: '1366x768', value: '1366x768' },
					{ label: '1024x768', value: '1024x768' },
					{ label: '800x600', value: '800x600' },
				],
			},
		}),
		customResolution: Property.ShortText({
			displayName: 'Custom Resolution',
			description: 'Custom resolution in format "widthxheight" (e.g., "1440x900"). Leave blank to use selected resolution above.',
			required: false,
		}),
		waitUntil: Property.StaticDropdown({
			displayName: 'Page Load Strategy',
			description: 'When to consider the page loaded. Default: load',
			required: false,
			defaultValue: 'load',
			options: {
				options: [
					{ label: 'Load (Page + Assets) - Default', value: 'load' },
					{ label: 'DOM Content Loaded', value: 'domContentLoaded' },
					{ label: 'Complete (Page + Iframes)', value: 'complete' },
					{ label: 'No Wait (Return Immediately)', value: 'noWait' },
				],
			},
		}),
		waitUntilTimeoutSeconds: Property.Number({
			displayName: 'Page Load Timeout (seconds)',
			description: 'Maximum time to wait for page loading. Default: 30 seconds',
			required: false,
		}),
	},
	async run(context) {
		const {
			sessionId,
			url,
			screenResolution,
			customResolution,
			waitUntil,
			waitUntilTimeoutSeconds,
		} = context.propsValue;

		await propsValidation.validateZod(context.propsValue, {
			url: z.string().url().optional(),
			customResolution: z.string().regex(/^\d+x\d+$/, 'Must be in format "widthxheight" (e.g., "1920x1080")').optional(),
			waitUntilTimeoutSeconds: z.number().positive().optional(),
		});

		const body: Record<string, any> = {};

		if (url) body['url'] = url;
		
		const finalResolution = customResolution || screenResolution;
		if (finalResolution) body['screenResolution'] = finalResolution;
		
		if (waitUntil) body['waitUntil'] = waitUntil;
		if (waitUntilTimeoutSeconds) body['waitUntilTimeoutSeconds'] = waitUntilTimeoutSeconds;

		const response = await airtopApiCall({
			apiKey: context.auth,
			method: HttpMethod.POST,
			resourceUri: `/sessions/${sessionId}/windows`,
			body,
		});

		return response;
	},
});
