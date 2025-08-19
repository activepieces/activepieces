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
			description: 'Clear the input field before typing text.',
			defaultValue: false,
			required: false,
		}),
		pressEnterKey: Property.Checkbox({
			displayName: 'Press Enter After Typing',
			description: 'Press Enter key after typing text.',
			defaultValue: false,
			required: false,
		}),
		pressTabKey: Property.Checkbox({
			displayName: 'Press Tab After Typing',
			description: 'Press Tab key after typing text (after Enter if both enabled).',
			defaultValue: false,
			required: false,
		}),
		waitForNavigation: Property.Checkbox({
			displayName: 'Wait for Navigation After Typing',
			description: 'Wait for page navigation to complete after typing (default: false).',
			defaultValue: false,
			required: false,
		}),
		navigationTimeoutSeconds: Property.Number({
			displayName: 'Navigation Timeout (Seconds)',
			description: 'Max time to wait for navigation after typing (default: 30).',
			required: false,
		}),
		navigationWaitUntil: Property.StaticDropdown({
			displayName: 'Navigation Wait Strategy',
			description: 'Condition to consider navigation complete (default: load).',
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
			description: 'Controls how much of the page is analyzed to find the input (default: auto).',
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
			description: 'Maximum number of scrolls in scan mode (default: 50).',
			required: false,
		}),
		visualAnalysisOverlap: Property.Number({
			displayName: 'Chunk Overlap (%)',
			description: 'Percentage of overlap between visual chunks (default: 30).',
			required: false,
		}),
		visualAnalysisDirection: Property.StaticDropdown({
			displayName: 'Partition Direction',
			description: 'Direction to partition screenshots (default: vertical).',
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
			description: 'How to select from multiple matches (default: auto).',
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
			description: 'Delay between scrolls in scan mode (default: 1000ms).',
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
			visualAnalysisMaxScrolls: z.number().min(1).optional(),
			visualAnalysisOverlap: z.number().min(0).max(100).optional(),
			visualAnalysisScrollDelay: z.number().min(0).optional(),
		});

		const body: Record<string, any> = {
			text,
		};

		if (elementDescription) {
			body['elementDescription'] = elementDescription;
		}
		if (clearInputField === true) {
			body['clearInputField'] = clearInputField;
		}
		if (pressEnterKey === true) {
			body['pressEnterKey'] = pressEnterKey;
		}
		if (pressTabKey === true) {
			body['pressTabKey'] = pressTabKey;
		}
		if (clientRequestId) {
			body['clientRequestId'] = clientRequestId;
		}

		const configuration: Record<string, any> = {};

		const visualAnalysis: Record<string, any> = {};
		if (analysisScope !== 'auto') {
			visualAnalysis['scope'] = analysisScope;
		}
		if (typeof visualAnalysisMaxScrolls === 'number') {
			visualAnalysis['maxScanScrolls'] = visualAnalysisMaxScrolls;
		}
		if (typeof visualAnalysisOverlap === 'number') {
			visualAnalysis['overlapPercentage'] = visualAnalysisOverlap;
		}
		if (visualAnalysisDirection !== 'vertical') {
			visualAnalysis['partitionDirection'] = visualAnalysisDirection;
		}
		if (visualAnalysisStrategy !== 'auto') {
			visualAnalysis['resultSelectionStrategy'] = visualAnalysisStrategy;
		}
		if (typeof visualAnalysisScrollDelay === 'number') {
			visualAnalysis['scanScrollDelay'] = visualAnalysisScrollDelay;
		}

		if (Object.keys(visualAnalysis).length > 0) {
			configuration['visualAnalysis'] = visualAnalysis;
		}

		if (scrollWithin) {
			configuration['experimental'] = {
				scrollWithin,
			};
		}

		if (waitForNavigation) {
			configuration['waitForNavigation'] = true;
			
			const waitForNavigationConfig: Record<string, any> = {};
			if (typeof navigationTimeoutSeconds === 'number') {
				waitForNavigationConfig['timeoutSeconds'] = navigationTimeoutSeconds;
			}
			if (navigationWaitUntil !== 'load') {
				waitForNavigationConfig['waitUntil'] = navigationWaitUntil;
			}
			
			if (Object.keys(waitForNavigationConfig).length > 0) {
				configuration['waitForNavigationConfig'] = waitForNavigationConfig;
			}
		}

		if (typeof costThresholdCredits === 'number') {
			configuration['costThresholdCredits'] = costThresholdCredits;
		}
		if (typeof timeThresholdSeconds === 'number') {
			configuration['timeThresholdSeconds'] = timeThresholdSeconds;
		}

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
