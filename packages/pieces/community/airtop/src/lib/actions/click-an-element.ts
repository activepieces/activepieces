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
		clientRequestId: Property.ShortText({
			displayName: 'Client Request ID',
			description: 'Optional ID to track this request.',
			required: false,
		}),
		clickType: Property.StaticDropdown({
			displayName: 'Click Type',
			description: 'The type of click to perform (default: left click).',
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
		scrollWithin: Property.ShortText({
			displayName: 'Scroll Within',
			description: 'Describe the scrollable area to search within (e.g. "main content area").',
			required: false,
		}),
		analysisScope: Property.StaticDropdown({
			displayName: 'Page Analysis Scope',
			description: 'Controls how much of the page is visually analyzed (default: auto).',
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
			description: 'Wait for page navigation to complete after clicking (default: false).',
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
	async run(context) {
		const {
			sessionId,
			windowId,
			elementDescription,
			clickType,
			scrollWithin,
			analysisScope,
			resultSelectionStrategy,
			partitionDirection,
			maxScanScrolls,
			scanScrollDelay,
			overlapPercentage,
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
			maxScanScrolls: z.number().min(1).optional(),
			scanScrollDelay: z.number().min(0).optional(),
			overlapPercentage: z.number().min(0).max(100).optional(),
		});

		const config: Record<string, any> = {};

		if (clickType !== 'click') {
			config['clickType'] = clickType;
		}

		if (scrollWithin) {
			config['experimental'] = {
				scrollWithin,
			};
		}

		const visualAnalysis: Record<string, any> = {};
		
		if (analysisScope !== 'auto') {
			visualAnalysis['scope'] = analysisScope;
		}
		
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
		
		if (Object.keys(visualAnalysis).length > 0) {
			config['visualAnalysis'] = visualAnalysis;
		}

		if (waitForNavigation) {
			config['waitForNavigation'] = true;
			
			const waitForNavigationConfig: Record<string, any> = {};
			if (navigationWaitUntil !== 'load') {
				waitForNavigationConfig['waitUntil'] = navigationWaitUntil;
			}
			if (typeof navigationTimeoutSeconds === 'number') {
				waitForNavigationConfig['timeoutSeconds'] = navigationTimeoutSeconds;
			}
			
			if (Object.keys(waitForNavigationConfig).length > 0) {
				config['waitForNavigationConfig'] = waitForNavigationConfig;
			}
		}

		if (typeof costThresholdCredits === 'number') {
			config['costThresholdCredits'] = costThresholdCredits;
		}
		
		if (typeof timeThresholdSeconds === 'number') {
			config['timeThresholdSeconds'] = timeThresholdSeconds;
		}

		const body: Record<string, any> = {
			elementDescription,
		};

		if (clientRequestId) {
			body['clientRequestId'] = clientRequestId;
		}
		
		if (Object.keys(config).length > 0) {
			body['configuration'] = config;
		}

		const response = await airtopApiCall({
			apiKey: context.auth,
			method: HttpMethod.POST,
			resourceUri: `/sessions/${sessionId}/windows/${windowId}/click`,
			body,
		});

		return response;
	},
});
