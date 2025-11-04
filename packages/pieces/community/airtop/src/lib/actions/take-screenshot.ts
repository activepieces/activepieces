import { HttpMethod, propsValidation } from '@activepieces/pieces-common';
import { createAction, Property, DynamicPropsValue, InputPropertyMap, PropertyContext } from '@activepieces/pieces-framework';
import { airtopAuth } from '../common/auth';
import { airtopApiCall } from '../common/client';
import { sessionId, windowId } from '../common/props';
import { z } from 'zod';

export const takeScreenshotAction = createAction({
	name: 'take-screenshot',
	auth: airtopAuth,
	displayName: 'Take Screenshot',
	description: 'Captures a screenshot of the current window.',
	props: {
		sessionId: sessionId,
		windowId: windowId,
		clientRequestId: Property.ShortText({
			displayName: 'Client Request ID',
			description: 'Optional ID for tracking this request',
			required: false,
		}),
		format: Property.StaticDropdown({
			displayName: 'Screenshot Format',
			description: 'How to return the screenshot. Default: base64 for viewport, url for page/scan',
			required: false,
			defaultValue: 'base64',
			options: {
				options: [
					{ label: 'Base64 Data (Default for Viewport)', value: 'base64' },
					{ label: 'Download URL (Default for Page/Scan)', value: 'url' },
				],
			},
		}),
		scope: Property.StaticDropdown({
			displayName: 'Screenshot Scope',
			description: 'What part of the page to capture. Default: auto',
			required: false,
			defaultValue: 'auto',
			options: {
				options: [
					{ label: 'Auto (Recommended)', value: 'auto' },
					{ label: 'Current View Only', value: 'viewport' },
					{ label: 'Full Page', value: 'page' },
					{ label: 'Scan Mode (For Problem Pages)', value: 'scan' },
				],
			},
		}),
		maxHeight: Property.Number({
			displayName: 'Max Height (pixels)',
			description: 'Maximum height of screenshot. Will scale down if needed, preserving aspect ratio.',
			required: false,
		}),
		maxWidth: Property.Number({
			displayName: 'Max Width (pixels)',
			description: 'Maximum width of screenshot. Will scale down if needed, preserving aspect ratio.',
			required: false,
		}),
		quality: Property.Number({
			displayName: 'JPEG Quality (1-100)',
			description: 'Image quality for JPEG compression. Higher = better quality. Note: Feature in development.',
			required: false,
		}),
		enableVisualAnalysis: Property.Checkbox({
			displayName: 'Enable Advanced Visual Analysis',
			description: 'Enable advanced visual analysis features for better page processing',
			required: false,
			defaultValue: false,
		}),
		visualAnalysisConfig: Property.DynamicProperties({
			displayName: 'Visual Analysis Settings',
			refreshers: ['enableVisualAnalysis'],
			required: false,
			props: async (propsValue: Record<string, unknown>, _ctx: PropertyContext): Promise<InputPropertyMap> => {
				const enableVisualAnalysis = propsValue['enableVisualAnalysis'] as boolean | undefined;

				if (enableVisualAnalysis) {
					return {
						analysisScope: Property.StaticDropdown({
							displayName: 'Analysis Scope',
							description: 'Override main scope setting for visual analysis. Default: auto',
							required: false,
							defaultValue: 'auto',
							options: {
								options: [
									{ label: 'Auto (Recommended)', value: 'auto' },
									{ label: 'Current View Only', value: 'viewport' },
									{ label: 'Full Page', value: 'page' },
									{ label: 'Scan Mode', value: 'scan' },
								],
							},
						}),
						partitionDirection: Property.StaticDropdown({
							displayName: 'Partition Direction',
							description: 'How to split the screenshot into chunks. Default: vertical',
							required: false,
							defaultValue: 'vertical',
							options: {
								options: [
									{ label: 'Vertical (Recommended)', value: 'vertical' },
									{ label: 'Horizontal', value: 'horizontal' },
									{ label: 'Both Directions', value: 'bidirectional' },
								],
							},
						}),
						resultSelectionStrategy: Property.StaticDropdown({
							displayName: 'Result Selection Strategy',
							description: 'How to select the best match when multiple results found. Default: auto',
							required: false,
							defaultValue: 'auto',
							options: {
								options: [
									{ label: 'Auto (Let System Decide)', value: 'auto' },
									{ label: 'First Match Found', value: 'first' },
									{ label: 'Best Match Overall', value: 'bestMatch' },
								],
							},
						}),
						maxScanScrolls: Property.Number({
							displayName: 'Max Scan Scrolls',
							description: 'Maximum number of scrolls in scan mode. Default: 50',
							required: false,
						}),
						overlapPercentage: Property.Number({
							displayName: 'Overlap Percentage',
							description: 'Percentage of overlap between screenshot chunks. Default: 30',
							required: false,
						}),
						scanScrollDelay: Property.Number({
							displayName: 'Scroll Delay (ms)',
							description: 'Delay between scrolls in scan mode. Default: 1000ms',
							required: false,
						}),
					};
				}
				return {};
			},
		}),
		costThresholdCredits: Property.Number({
			displayName: 'Maximum Credits to Spend',
			description: 'Stop screenshot if it costs more than this. Leave blank for default limit.',
			required: false,
		}),
		timeThresholdSeconds: Property.Number({
			displayName: 'Maximum Time (seconds)',
			description: 'Stop screenshot if it takes longer than this. Leave blank for default timeout.',
			required: false,
		}),
	},
	async run(context) {
		const {
			sessionId,
			windowId,
			clientRequestId,
			format,
			scope,
			maxHeight,
			maxWidth,
			quality,
			enableVisualAnalysis,
			visualAnalysisConfig,
			costThresholdCredits,
			timeThresholdSeconds,
		} = context.propsValue as {
			sessionId: string;
			windowId: string;
			clientRequestId?: string;
			format?: string;
			scope?: string;
			maxHeight?: number;
			maxWidth?: number;
			quality?: number;
			enableVisualAnalysis?: boolean;
			visualAnalysisConfig?: {
				analysisScope?: string;
				partitionDirection?: string;
				resultSelectionStrategy?: string;
				maxScanScrolls?: number;
				overlapPercentage?: number;
				scanScrollDelay?: number;
			};
			costThresholdCredits?: number;
			timeThresholdSeconds?: number;
		};

		await propsValidation.validateZod(context.propsValue, {
			maxHeight: z.number().positive().optional(),
			maxWidth: z.number().positive().optional(),
			quality: z.number().min(1).max(100).optional(),
			costThresholdCredits: z.number().min(0).optional(),
			timeThresholdSeconds: z.number().min(0).optional(),
		});

		const body: Record<string, any> = {};

		if (clientRequestId) {
			body['clientRequestId'] = clientRequestId;
		}
		if (typeof costThresholdCredits === 'number') {
			body['costThresholdCredits'] = costThresholdCredits;
		}
		if (typeof timeThresholdSeconds === 'number') {
			body['timeThresholdSeconds'] = timeThresholdSeconds;
		}

		const config: Record<string, any> = {};

		const screenshotConfig: Record<string, any> = {};
		if (format && format !== 'base64') {
			screenshotConfig['format'] = format;
		}
		if (typeof maxHeight === 'number') {
			screenshotConfig['maxHeight'] = maxHeight;
		}
		if (typeof maxWidth === 'number') {
			screenshotConfig['maxWidth'] = maxWidth;
		}
		if (typeof quality === 'number') {
			screenshotConfig['quality'] = quality;
		}

		if (Object.keys(screenshotConfig).length > 0) {
			config['screenshot'] = screenshotConfig;
		}

		// Visual analysis configuration - always include scope here, never at top level
		const visualAnalysis: Record<string, any> = {};
		
		// Use the main scope setting or override from visual analysis config
		const effectiveScope = (enableVisualAnalysis && visualAnalysisConfig?.analysisScope) || scope;
		if (effectiveScope && effectiveScope !== 'auto') {
			visualAnalysis['scope'] = effectiveScope;
		}

		// Add other visual analysis settings if enabled
		if (enableVisualAnalysis && visualAnalysisConfig) {
			if (visualAnalysisConfig.partitionDirection && visualAnalysisConfig.partitionDirection !== 'vertical') {
				visualAnalysis['partitionDirection'] = visualAnalysisConfig.partitionDirection;
			}
			if (visualAnalysisConfig.resultSelectionStrategy && visualAnalysisConfig.resultSelectionStrategy !== 'auto') {
				visualAnalysis['resultSelectionStrategy'] = visualAnalysisConfig.resultSelectionStrategy;
			}
			if (typeof visualAnalysisConfig.maxScanScrolls === 'number') {
				visualAnalysis['maxScanScrolls'] = visualAnalysisConfig.maxScanScrolls;
			}
			if (typeof visualAnalysisConfig.overlapPercentage === 'number') {
				visualAnalysis['overlapPercentage'] = visualAnalysisConfig.overlapPercentage;
			}
			if (typeof visualAnalysisConfig.scanScrollDelay === 'number') {
				visualAnalysis['scanScrollDelay'] = visualAnalysisConfig.scanScrollDelay;
			}
		}

		if (Object.keys(visualAnalysis).length > 0) {
			config['visualAnalysis'] = visualAnalysis;
		}

		if (Object.keys(config).length > 0) {
			body['configuration'] = config;
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
