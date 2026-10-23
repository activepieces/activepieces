import { Property } from '@activepieces/pieces-framework';

import type { PropParams } from './props';

function model<R extends boolean>({
	required,
	displayName = 'Model',
	description = 'Model AIR ID, e.g. "runware:101@1". Use Search Models to find one. Each model accepts only the parameters listed on its page at https://runware.ai/docs/models.',
}: PropParams<R>) {
	return Property.ShortText({ displayName, description, required });
}

function positivePrompt<R extends boolean>({
	required,
	displayName = 'Prompt',
	description = 'Text describing what to generate.',
}: PropParams<R>) {
	return Property.LongText({ displayName, description, required });
}

function negativePrompt<R extends boolean>({
	required,
	displayName = 'Negative Prompt',
	description = 'Text describing what to avoid. Only models that support it accept it.',
}: PropParams<R>) {
	return Property.LongText({ displayName, description, required });
}

function width<R extends boolean>({
	required,
	displayName = 'Width',
	description = "Output width in pixels, within the model's allowed range.",
}: PropParams<R>) {
	return Property.Number({ displayName, description, required });
}

function height<R extends boolean>({
	required,
	displayName = 'Height',
	description = "Output height in pixels, within the model's allowed range.",
}: PropParams<R>) {
	return Property.Number({ displayName, description, required });
}

function seed<R extends boolean>({
	required,
	displayName = 'Seed',
	description = 'Fixed seed for reproducible results. Random when omitted.',
}: PropParams<R>) {
	return Property.Number({ displayName, description, required });
}

function numberResults<R extends boolean>({
	required,
	displayName = 'Number of Results',
	description = 'How many outputs to generate in this call. Defaults to 1.',
}: PropParams<R>) {
	return Property.Number({ displayName, description, required });
}

function outputFormat<R extends boolean>({
	required,
	displayName = 'Output Format',
	description = 'Output file format the model supports, e.g. "PNG". Defaults to the model\'s default.',
}: PropParams<R>) {
	return Property.ShortText({ displayName, description, required });
}

function image<R extends boolean>({
	required,
	displayName = 'Image',
	description = 'The image to process: a public URL, a Runware image or media UUID (from Upload Media or an earlier result), a data URI or base64.',
}: PropParams<R>) {
	return Property.ShortText({ displayName, description, required });
}

function video<R extends boolean>({
	required,
	displayName = 'Video',
	description = 'The video to process, for video models: a public URL or a Runware media UUID. Video models run asynchronously.',
}: PropParams<R>) {
	return Property.ShortText({ displayName, description, required });
}

function inputs<R extends boolean>({
	required,
	displayName = 'Inputs',
	description = 'Input assets object, e.g. {"seedImage": "<url>"}, {"referenceImages": ["<url>"]} or {"frameImages": ["<url>"]}. Keys the model accepts are listed on its page.',
}: PropParams<R>) {
	return Property.Json({ displayName, description, required });
}

function settings<R extends boolean>({
	required,
	displayName = 'Settings',
	description = 'Model-specific tuning object, sent as "settings", e.g. {"maxTokens": 500}. Keys the model accepts are listed on its page.',
}: PropParams<R>) {
	return Property.Json({ displayName, description, required });
}

function additionalParams<R extends boolean>({
	required,
	displayName = 'Additional Parameters',
	description = 'Other top-level parameters from the model\'s schema, e.g. {"steps": 30, "CFGScale": 7, "providerSettings": {...}}. The dedicated inputs above take precedence.',
}: PropParams<R>) {
	return Property.Json({ displayName, description, required });
}

function taskUUID<R extends boolean>({
	required,
	displayName = 'Task UUID',
	description = 'The taskUUID returned by an earlier Runware action.',
}: PropParams<R>) {
	return Property.ShortText({ displayName, description, required });
}

function usageWindow() {
	return {
		startDate: Property.ShortText({
			displayName: 'Start Date',
			description: 'First day of the window, YYYY-MM-DD (inclusive).',
			required: true,
		}),
		endDate: Property.ShortText({
			displayName: 'End Date',
			description:
				'Last day of the window, YYYY-MM-DD (inclusive). At most 30 days after the start date.',
			required: true,
		}),
		models: Property.Array({
			displayName: 'Models',
			description: 'Only count these model AIR IDs. All models when omitted.',
			required: false,
		}),
		groupBy: Property.Array({
			displayName: 'Group By',
			description:
				'Breakdowns to return, from "date", "model", "apiKey". Defaults to ["date", "model"].',
			required: false,
		}),
		timezone: Property.ShortText({
			displayName: 'Timezone',
			description: 'IANA timezone used to bucket days, e.g. "Europe/Berlin". Defaults to UTC.',
			required: false,
		}),
	};
}

export const runwareAiProps = {
	model,
	positivePrompt,
	negativePrompt,
	width,
	height,
	seed,
	numberResults,
	outputFormat,
	image,
	video,
	inputs,
	settings,
	additionalParams,
	taskUUID,
	usageWindow,
};
