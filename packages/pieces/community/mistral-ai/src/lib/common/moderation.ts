function formatResponse({ response, inputs }: { response: ModerationResponse; inputs: string[] }) {
	const results = response.results.map((result, index) => {
		const flagged = Object.entries(result.categories ?? {})
			.filter(([, value]) => value === true)
			.map(([category]) => category);
		return {
			input: inputs[index] ?? null,
			flagged: flagged.length > 0,
			flagged_categories: flagged,
			categories: result.categories ?? {},
			category_scores: result.category_scores ?? {},
		};
	});
	return {
		id: response.id,
		model: response.model,
		any_flagged: results.some((result) => result.flagged),
		results,
	};
}

export const moderationUtils = { formatResponse };

export type ModerationResponse = {
	id: string;
	model: string;
	results: { categories?: Record<string, boolean>; category_scores?: Record<string, number> }[];
};
