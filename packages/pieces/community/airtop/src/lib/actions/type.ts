import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, propsValidation } from '@activepieces/pieces-common';
import { airtopAuth } from '../common/auth';
import { airtopApiCall } from '../common/client';
import { sessionId, windowId } from '../common/props';
import { z } from 'zod';

export const typeAction = createAction({
	name: 'type',
	auth: airtopAuth,
	displayName: 'Type',
	description: 'Type into a browser window at the specified field.',
	props: {
		sessionId: sessionId,
		windowId: windowId,
		text: Property.LongText({
			displayName: 'Text to Type',
			description: 'The text to type into the browser window.',
			required: true,
		}),
		elementDescription: Property.ShortText({
			displayName: 'Element Description',
			description: 'Describe the element (e.g., "search box", "username field").',
			required: false,
		}),
		clearInputField: Property.Checkbox({
			displayName: 'Clear Input Field Before Typing',
			defaultValue: false,
			required: false,
		}),
		pressEnterKey: Property.Checkbox({
			displayName: 'Press Enter After Typing',
			defaultValue: false,
			required: false,
		}),
		pressTabKey: Property.Checkbox({
			displayName: 'Press Tab After Typing',
			defaultValue: false,
			required: false,
		}),
		waitForNavigation: Property.Checkbox({
			displayName: 'Wait for Navigation After Typing',
			description: 'Wait for page navigation to complete after typing.',
			defaultValue: false,
			required: false,
		}),
		navigationTimeoutSeconds: Property.Number({
			displayName: 'Navigation Timeout (Seconds)',
			description: 'Max time to wait for navigation after typing. Default: 30.',
			required: false,
		}),
		navigationWaitUntil: Property.StaticDropdown({
			displayName: 'Navigation Wait Strategy',
			description: 'Condition to consider navigation complete.',
			required: false,
			defaultValue: 'load',
			options: {
				options: [
					{ label: 'Load (Default)', value: 'load' },
					{ label: 'DOM Content Loaded', value: 'domcontentloaded' },
					{ label: 'Network Idle 0', value: 'networkidle0' },
					{ label: 'Network Idle 2', value: 'networkidle2' },
				],
			},
		}),
		analysisScope: Property.StaticDropdown({
			displayName: 'Page Analysis Scope',
			description: 'Controls how much of the page is analyzed to find the input.',
			defaultValue: 'auto',
			required: false,
			options: {
				options: [
					{ label: 'Auto (Recommended)', value: 'auto' },
					{ label: 'Viewport Only', value: 'viewport' },
					{ label: 'Full Page', value: 'page' },
					{ label: 'Scan Mode', value: 'scan' },
				],
			},
		}),
		visualAnalysisMaxScrolls: Property.Number({
			displayName: 'Max Scrolls (Scan Mode)',
			description: 'Defaults to 50. Applies only in scan mode.',
			required: false,
		}),
		visualAnalysisOverlap: Property.Number({
			displayName: 'Chunk Overlap (%)',
			description: 'Defaults to 30. Overlap between visual chunks.',
			required: false,
		}),
		visualAnalysisDirection: Property.StaticDropdown({
			displayName: 'Partition Direction',
			required: false,
			defaultValue: 'vertical',
			options: {
				options: [
					{ label: 'Vertical (Default)', value: 'vertical' },
					{ label: 'Horizontal', value: 'horizontal' },
					{ label: 'Bidirectional', value: 'bidirectional' },
				],
			},
		}),
		visualAnalysisStrategy: Property.StaticDropdown({
			displayName: 'Result Selection Strategy',
			required: false,
			defaultValue: 'auto',
			options: {
				options: [
					{ label: 'Auto (Default)', value: 'auto' },
					{ label: 'First Match', value: 'first' },
					{ label: 'Best Match', value: 'bestMatch' },
				],
			},
		}),
		visualAnalysisScrollDelay: Property.Number({
			displayName: 'Scroll Delay (ms)',
			description: 'Delay between scrolls. Default: 1000ms.',
			required: false,
		}),
		scrollWithin: Property.ShortText({
			displayName: 'Scroll Within',
			description: 'Describe the scrollable container (e.g., "table body", "product list").',
			required: false,
		}),
		clientRequestId: Property.ShortText({
			displayName: 'Client Request ID',
			description: 'Optional request ID for traceability.',
			required: false,
		}),
		costThresholdCredits: Property.Number({
			displayName: 'Max Credits to Spend',
			description: 'Cancel if this limit is exceeded. Set 0 to disable.',
			required: false,
		}),
		timeThresholdSeconds: Property.Number({
			displayName: 'Max Time to Wait (Seconds)',
			description: 'Cancel if exceeded. Set 0 to disable.',
			required: false,
		}),
	},
	async run(context) {
		const {
			sessionId,
			windowId,
			text,
			elementDescription,
			clearInputField,
			pressEnterKey,
			pressTabKey,
			waitForNavigation,
			navigationTimeoutSeconds,
			navigationWaitUntil,
			analysisScope,
			visualAnalysisMaxScrolls,
			visualAnalysisOverlap,
			visualAnalysisDirection,
			visualAnalysisStrategy,
			visualAnalysisScrollDelay,
			scrollWithin,
			clientRequestId,
			costThresholdCredits,
			timeThresholdSeconds,
		} = context.propsValue;

		await propsValidation.validateZod(context.propsValue, {
			costThresholdCredits: z.number().min(0).optional(),
			timeThresholdSeconds: z.number().min(0).optional(),
			navigationTimeoutSeconds: z.number().min(0).optional(),
			visualAnalysisOverlap: z.number().min(0).max(100).optional(),
			visualAnalysisScrollDelay: z.number().min(0).optional(),
		});

		const body: Record<string, any> = {
			text,
		};

		if (elementDescription) body['elementDescription'] = elementDescription;
		if (clearInputField !== undefined) body['clearInputField'] = clearInputField;
		if (pressEnterKey !== undefined) body['pressEnterKey'] = pressEnterKey;
		if (pressTabKey !== undefined) body['pressTabKey'] = pressTabKey;
		if (clientRequestId) body['clientRequestId'] = clientRequestId;

		const visualAnalysis: Record<string, any> = {};
		if (analysisScope) visualAnalysis['scope'] = analysisScope;
		if (visualAnalysisMaxScrolls) visualAnalysis['maxScanScrolls'] = visualAnalysisMaxScrolls;
		if (visualAnalysisOverlap) visualAnalysis['overlapPercentage'] = visualAnalysisOverlap;
		if (visualAnalysisDirection) visualAnalysis['partitionDirection'] = visualAnalysisDirection;
		if (visualAnalysisStrategy) visualAnalysis['resultSelectionStrategy'] = visualAnalysisStrategy;
		if (visualAnalysisScrollDelay) visualAnalysis['scanScrollDelay'] = visualAnalysisScrollDelay;

		const waitForNavigationConfig: Record<string, any> = {};
		if (navigationTimeoutSeconds) waitForNavigationConfig['timeoutSeconds'] = navigationTimeoutSeconds;
		if (navigationWaitUntil) waitForNavigationConfig['waitUntil'] = navigationWaitUntil;

		const configuration: Record<string, any> = {};
		if (Object.keys(visualAnalysis).length > 0) configuration['visualAnalysis'] = visualAnalysis;
		if (scrollWithin) configuration['scrollWithin'] = scrollWithin;
		if (waitForNavigation && Object.keys(waitForNavigationConfig).length > 0) {
			configuration['waitForNavigationConfig'] = waitForNavigationConfig;
		}
		if (waitForNavigation) configuration['waitForNavigation'] = true;
		if (typeof costThresholdCredits === 'number') configuration['costThresholdCredits'] = costThresholdCredits;
		if (typeof timeThresholdSeconds === 'number') configuration['timeThresholdSeconds'] = timeThresholdSeconds;

		if (Object.keys(configuration).length > 0) {
			body['configuration'] = configuration;
		}

		const response = await airtopApiCall({
			apiKey: context.auth,
			method: HttpMethod.POST,
			resourceUri: `/sessions/${sessionId}/windows/${windowId}/type`,
			body,
		});
		return response;
	},
});
