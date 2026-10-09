import type { ScrapegraphaiFormat } from './types';

function buildFormats({
	types,
	mode,
	jsonPrompt,
	jsonSchema,
}: {
	types: string[];
	mode?: string;
	jsonPrompt?: string;
	jsonSchema?: Record<string, unknown>;
}): ScrapegraphaiFormat[] {
	return types.map((type) => {
		if (type === 'json') {
			return { type, prompt: jsonPrompt, schema: jsonSchema };
		}
		if (type === 'markdown' || type === 'html') {
			return { type, mode };
		}
		return { type };
	});
}

export const scrapegraphaiUtils = { buildFormats };
