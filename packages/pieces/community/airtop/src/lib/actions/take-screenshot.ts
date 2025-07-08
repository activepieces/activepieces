import { HttpMethod, propsValidation } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { airtopAuth } from '../common/auth';
import { airtopApiCall } from '../common/client';
import { sessionId, windowId } from '../common/props';
import { z } from 'zod';

export const takeScreenshotAction = createAction({
	name: 'take-screenshot',
	auth: airtopAuth,
	displayName: 'Take Screenshot',
	description: 'Captures a screenshot of the current browser window.',
	props: {
		sessionId: sessionId,
		windowId: windowId,
		clientRequestId: Property.ShortText({
			displayName: 'Client Request ID',
			description: 'Optional ID to help track this request.',
			required: false,
		}),
		format: Property.StaticDropdown({
			displayName: 'Screenshot Format',
			description: 'Choose whether to return a base64 image or a downloadable URL.',
			defaultValue: 'base64',
			required: false,
			options: {
				options: [
					{ label: 'Base64 (Inline)', value: 'base64' },
					{ label: 'URL (Download Link)', value: 'url' },
				],
			},
		}),
		maxHeight: Property.Number({
			displayName: 'Max Height (px)',
			description: 'Maximum height of the screenshot. Aspect ratio preserved.',
			required: false,
		}),
		maxWidth: Property.Number({
			displayName: 'Max Width (px)',
			description: 'Maximum width of the screenshot. Aspect ratio preserved.',
			required: false,
		}),
		quality: Property.Number({
			displayName: 'JPEG Quality (1-100)',
			description: 'Controls compression quality (higher = better). Default varies.',
			required: false,
		}),
		scope: Property.StaticDropdown({
			displayName: 'Screenshot Scope',
			description: 'Determines how much of the page to capture.',
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
			description: 'Max number of scrolls when using scan mode. Default: 50.',
			required: false,
		}),
		visualAnalysisOverlap: Property.Number({
			displayName: 'Chunk Overlap (%)',
			description: 'Overlap between screenshot chunks. Default: 30%.',
			required: false,
		}),
		visualAnalysisDirection: Property.StaticDropdown({
			displayName: 'Partition Direction',
			required: false,
			defaultValue: 'vertical',
			options: {
				options: [
					{ label: 'Vertical', value: 'vertical' },
					{ label: 'Horizontal', value: 'horizontal' },
					{ label: 'Bidirectional', value: 'bidirectional' },
				],
			},
		}),
		visualAnalysisResultStrategy: Property.StaticDropdown({
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
			description: 'Delay between scrolls in scan mode. Default: 1000ms.',
			required: false,
		}),
		visualAnalysisScope: Property.StaticDropdown({
			displayName: 'Visual Analysis Scope',
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
		costThresholdCredits: Property.Number({
			displayName: 'Maximum Credits to Spend',
			description: 'Abort if the credit usage exceeds this amount. Set 0 to disable.',
			required: false,
		}),
		timeThresholdSeconds: Property.Number({
			displayName: 'Maximum Time (Seconds)',
			description: 'Abort if it takes longer than this time. Set 0 to disable.',
			required: false,
		}),
	},
	async run(context) {
		const {
			sessionId,
			windowId,
			clientRequestId,
			format,
			maxHeight,
			maxWidth,
			quality,
			scope,
			visualAnalysisMaxScrolls,
			visualAnalysisOverlap,
			visualAnalysisDirection,
			visualAnalysisResultStrategy,
			visualAnalysisScrollDelay,
			visualAnalysisScope,
			costThresholdCredits,
			timeThresholdSeconds,
		} = context.propsValue;

		await propsValidation.validateZod(context.propsValue, {
			quality: z.number().min(1).max(100).optional(),
			costThresholdCredits: z.number().min(0).optional(),
			timeThresholdSeconds: z.number().min(0).optional(),
		});

		const body: Record<string, any> = {};

		if (clientRequestId) body['clientRequestId'] = clientRequestId;
		if (typeof costThresholdCredits === 'number') body['costThresholdCredits'] = costThresholdCredits;
		if (typeof timeThresholdSeconds === 'number') body['timeThresholdSeconds'] = timeThresholdSeconds;

		const screenshot: Record<string, any> = {};
		if (format) screenshot['format'] = format;
		if (maxHeight) screenshot['maxHeight'] = maxHeight;
		if (maxWidth) screenshot['maxWidth'] = maxWidth;
		if (quality) screenshot['quality'] = quality;
		if (scope) screenshot['scope'] = scope;

		const visualAnalysis: Record<string, any> = {};
		if (visualAnalysisMaxScrolls) visualAnalysis['maxScanScrolls'] = visualAnalysisMaxScrolls;
		if (visualAnalysisOverlap) visualAnalysis['overlapPercentage'] = visualAnalysisOverlap;
		if (visualAnalysisDirection) visualAnalysis['partitionDirection'] = visualAnalysisDirection;
		if (visualAnalysisResultStrategy) visualAnalysis['resultSelectionStrategy'] = visualAnalysisResultStrategy;
		if (visualAnalysisScrollDelay) visualAnalysis['scanScrollDelay'] = visualAnalysisScrollDelay;
		if (visualAnalysisScope) visualAnalysis['scope'] = visualAnalysisScope;

		const configuration: Record<string, any> = {};
		if (Object.keys(screenshot).length > 0) configuration['screenshot'] = screenshot;
		if (Object.keys(visualAnalysis).length > 0) configuration['visualAnalysis'] = visualAnalysis;

		if (Object.keys(configuration).length > 0) {
			body['configuration'] = configuration;
		}

		const response = await airtopApiCall({
			apiKey: context.auth,
			method: HttpMethod.POST,
			resourceUri: `/sessions/${sessionId}/windows/${windowId}/screenshot`,
			body,
		});

		return {
			message: `Screenshot captured for session ${sessionId}, window ${windowId}.`,
			response,
		};
	},
});
