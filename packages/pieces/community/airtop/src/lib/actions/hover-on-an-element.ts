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
		analysisScope: Property.StaticDropdown({
			displayName: 'Page Analysis Scope',
			defaultValue: 'auto',
			required: false,
			description: 'Controls how much of the page is visually analyzed.',
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
		overlapPercentage: Property.Number({
			displayName: 'Overlap Percentage',
			description: 'Chunk overlap percentage for visual scan (default 30).',
			required: false,
			defaultValue: 30,
		}),
		partitionDirection: Property.StaticDropdown({
			displayName: 'Partition Direction',
			description: 'Screenshot partitioning direction (default vertical).',
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
		resultSelectionStrategy: Property.StaticDropdown({
			displayName: 'Result Selection Strategy',
			description: 'Strategy to select the visual element.',
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
		maxScanScrolls: Property.Number({
			displayName: 'Max Scan Scrolls',
			description: 'Max scrolls in scan mode (default 50).',
			required: false,
			defaultValue: 50,
		}),
		scanScrollDelay: Property.Number({
			displayName: 'Scan Scroll Delay (ms)',
			description: 'Delay between scrolls during visual scan. Default 1000ms.',
			required: false,
			defaultValue: 1000,
		}),
		clientRequestId: Property.ShortText({
			displayName: 'Client Request ID',
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
			analysisScope,
			overlapPercentage,
			partitionDirection,
			resultSelectionStrategy,
			maxScanScrolls,
			scanScrollDelay,
			costThresholdCredits,
			timeThresholdSeconds,
		} = propsValue;

		await propsValidation.validateZod(propsValue, {
			costThresholdCredits: z.number().min(0).optional(),
			timeThresholdSeconds: z.number().min(0).optional(),
			overlapPercentage: z.number().min(0).max(100).optional(),
			maxScanScrolls: z.number().min(0).optional(),
			scanScrollDelay: z.number().min(0).optional(),
		});

		const configuration: Record<string, any> = {
			visualAnalysis: {},
		};

		if (analysisScope) configuration['scope'] = analysisScope;
		if (overlapPercentage !== undefined) configuration['visualAnalysis'].overlapPercentage = overlapPercentage;
		if (partitionDirection) configuration['visualAnalysis'].partitionDirection = partitionDirection;
		if (resultSelectionStrategy) configuration['visualAnalysis'].resultSelectionStrategy = resultSelectionStrategy;
		if (maxScanScrolls !== undefined) configuration['visualAnalysis'].maxScanScrolls = maxScanScrolls;
		if (scanScrollDelay !== undefined) configuration['visualAnalysis'].scanScrollDelay = scanScrollDelay;
		if (costThresholdCredits !== undefined) configuration['costThresholdCredits'] = costThresholdCredits;
		if (timeThresholdSeconds !== undefined) configuration['timeThresholdSeconds'] = timeThresholdSeconds;

		if (Object.keys(configuration['visualAnalysis']).length === 0) {
			delete configuration['visualAnalysis'];
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
