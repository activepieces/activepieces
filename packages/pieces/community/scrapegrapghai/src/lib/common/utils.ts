import type { ScrapegraphaiFormat } from './types';

function buildFormats({
	types,
	mode,
	jsonPrompt,
	jsonSchema,
}: {
	types?: string[];
	mode?: string;
	jsonPrompt?: string;
	jsonSchema?: Record<string, unknown>;
}): ScrapegraphaiFormat[] | undefined {
	if (!types || types.length === 0) {
		if (mode !== undefined || jsonPrompt !== undefined || jsonSchema !== undefined) {
			throw new Error(
				'Markdown/HTML Mode, JSON Prompt and JSON Schema apply to the selected Formats: set Formats as well, including json for JSON Prompt and JSON Schema.',
			);
		}
		return undefined;
	}
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
