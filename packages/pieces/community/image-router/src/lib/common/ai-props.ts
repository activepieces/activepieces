import { Property } from '@activepieces/pieces-framework';

import type { PropParams } from './props';

function model<R extends boolean>({
	required,
	displayName = 'Model',
	description = 'Model id, e.g. "openai/gpt-image-2". Use List Models to find ids and what each model supports.',
}: PropParams<R>) {
	return Property.ShortText({ displayName, description, required });
}

function quality<R extends boolean>({
	required,
	displayName = 'Quality',
	description = 'Output quality for models that support it. Defaults to auto.',
}: PropParams<R>) {
	return Property.StaticDropdown({
		displayName,
		description,
		required,
		options: {
			options: ['auto', 'low', 'medium', 'high'].map((value) => ({ label: value, value })),
		},
	});
}

function size<R extends boolean>({
	required,
	displayName = 'Size',
	description = '"auto" or WIDTHxHEIGHT such as "1024x1024". Allowed sizes per model are in Get Model. Defaults to auto.',
}: PropParams<R>) {
	return Property.ShortText({ displayName, description, required });
}

function outputFormat<R extends boolean>({
	required,
	displayName = 'Output Format',
	description = 'Image file format. Defaults to webp.',
}: PropParams<R>) {
	return Property.StaticDropdown({
		displayName,
		description,
		required,
		options: { options: ['webp', 'jpeg', 'png'].map((value) => ({ label: value, value })) },
	});
}

export const imageRouterAiProps = { model, quality, size, outputFormat };
