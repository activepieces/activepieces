import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { airtopAuth } from '../common/auth';
import { airtopApiCall } from '../common/client';
import { sessionId, windowId } from '../common/props';
import { propsValidation } from '@activepieces/pieces-common';
import { z } from 'zod';

export const hoverElementAction = createAction({
	auth: airtopAuth,
	name: 'hover-element',
	displayName: 'Hover on an Element',
	description: 'Moves mouse pointer over an element in the browser window.',
	props: {
		sessionId: sessionId,
		windowId: windowId,
		elementDescription: Property.ShortText({
			displayName: 'Element Description',
			description: 'Describe the element to hover, e.g. "the search box input in the top right corner".',
			required: true,
		}),
		clientRequestId: Property.ShortText({
			displayName: 'Client Request ID',
			description: 'Optional ID to track this request.',
			required: false,
		}),
		scrollWithin: Property.ShortText({
			displayName: 'Scroll Within',
			description: 'Describe the scrollable area to search within (e.g. "main content area").',
			required: false,
		}),
		analysisScope: Property.StaticDropdown({
			displayName: 'Page Analysis Scope',
			description: 'Controls how much of the page is visually analyzed (default: auto).',
			defaultValue: 'auto',
			required: false,
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
		resultSelectionStrategy: Property.StaticDropdown({
			displayName: 'Result Selection Strategy',
			description: 'How to select from multiple matches (default: auto).',
			required: false,
			defaultValue: 'auto',
			options: {
				disabled: false,
				options: [
					{ label: 'Auto', value: 'auto' },
					{ label: 'First Match', value: 'first' },
					{ label: 'Best Match', value: 'bestMatch' },
				],
			},
		}),
		partitionDirection: Property.StaticDropdown({
			displayName: 'Partition Direction',
			description: 'How to partition screenshots for analysis (default: vertical).',
			required: false,
			defaultValue: 'vertical',
			options: {
				disabled: false,
				options: [
					{ label: 'Vertical', value: 'vertical' },
					{ label: 'Horizontal', value: 'horizontal' },
					{ label: 'Bidirectional', value: 'bidirectional' },
				],
			},
		}),
		maxScanScrolls: Property.Number({
			displayName: 'Maximum Scan Scrolls',
			description: 'Maximum number of scrolls in scan mode (default: 50).',
			required: false,
		}),
		scanScrollDelay: Property.Number({
			displayName: 'Scan Scroll Delay (ms)',
			description: 'Delay between scrolls in scan mode (default: 1000ms).',
			required: false,
		}),
		overlapPercentage: Property.Number({
			displayName: 'Overlap Percentage',
			description: 'Percentage of overlap between screenshot chunks (default: 30).',
			required: false,
		}),
		waitForNavigation: Property.Checkbox({
			displayName: 'Wait for Navigation',
			description: 'Wait for page navigation to complete after hovering (default: false).',
			required: false,
			defaultValue: false,
		}),
		navigationWaitUntil: Property.StaticDropdown({
			displayName: 'Navigation Wait Until',
			description: 'When to consider navigation complete (default: load).',
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
			description: 'Max seconds to wait for navigation (default: 30).',
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
	},
	async run({ propsValue, auth }) {
		const {
			sessionId,
			windowId,
			elementDescription,
			clientRequestId,
			scrollWithin,
			analysisScope,
			resultSelectionStrategy,
			partitionDirection,
			maxScanScrolls,
			scanScrollDelay,
			overlapPercentage,
			waitForNavigation,
			navigationWaitUntil,
			navigationTimeoutSeconds,
			costThresholdCredits,
			timeThresholdSeconds,
		} = propsValue;

		await propsValidation.validateZod(propsValue, {
			costThresholdCredits: z.number().min(0).optional(),
			timeThresholdSeconds: z.number().min(0).optional(),
			navigationTimeoutSeconds: z.number().min(0).optional(),
			maxScanScrolls: z.number().min(1).optional(),
			scanScrollDelay: z.number().min(0).optional(),
			overlapPercentage: z.number().min(0).max(100).optional(),
		});

		const configuration: Record<string, any> = {};

		if (scrollWithin) {
			configuration['experimental'] = {
				scrollWithin,
			};
		}

		const visualAnalysis: Record<string, any> = {};
		
		visualAnalysis['scope'] = analysisScope;
		
		if (resultSelectionStrategy !== 'auto') {
			visualAnalysis['resultSelectionStrategy'] = resultSelectionStrategy;
		}
		
		if (partitionDirection !== 'vertical') {
			visualAnalysis['partitionDirection'] = partitionDirection;
		}
		
		if (typeof maxScanScrolls === 'number') {
			visualAnalysis['maxScanScrolls'] = maxScanScrolls;
		}
		
		if (typeof scanScrollDelay === 'number') {
			visualAnalysis['scanScrollDelay'] = scanScrollDelay;
		}
		
		if (typeof overlapPercentage === 'number') {
			visualAnalysis['overlapPercentage'] = overlapPercentage;
		}
		
		configuration['visualAnalysis'] = visualAnalysis;

		if (waitForNavigation) {
			const waitForNavigationConfig: Record<string, any> = {};
			if (navigationWaitUntil !== 'load') {
				waitForNavigationConfig['waitUntil'] = navigationWaitUntil;
			}
			if (typeof navigationTimeoutSeconds === 'number') {
				waitForNavigationConfig['timeoutSeconds'] = navigationTimeoutSeconds;
			}
			
			configuration['waitForNavigationConfig'] = waitForNavigationConfig;
		}

		if (typeof costThresholdCredits === 'number') {
			configuration['costThresholdCredits'] = costThresholdCredits;
		}
		
		if (typeof timeThresholdSeconds === 'number') {
			configuration['timeThresholdSeconds'] = timeThresholdSeconds;
		}

		const body: Record<string, any> = {
			elementDescription,
		};

		if (clientRequestId) {
			body['clientRequestId'] = clientRequestId;
		}

		if (Object.keys(configuration).length > 0) {
			body['configuration'] = configuration;
		}

		const response = await airtopApiCall({
			apiKey: auth,
			method: HttpMethod.POST,
			resourceUri: `/sessions/${sessionId}/windows/${windowId}/hover`,
			body,
		});

		return response;
	},
});
