function stringifyValues({ values }: { values: Record<string, unknown> }): Record<string, string> {
	return Object.fromEntries(
		Object.entries(values)
			.filter(([key, value]) => key.trim().length > 0 && value !== null && value !== undefined && value !== '')
			.map(([key, value]) => [key.trim(), typeof value === 'object' ? JSON.stringify(value) : String(value)]),
	);
}

function nonEmpty({ values }: { values: Record<string, string | undefined> }): Record<string, string> {
	return Object.fromEntries(
		Object.entries(values).flatMap(([key, value]) => {
			const trimmed = value?.trim();
			return trimmed ? [[key, trimmed]] : [];
		}),
	);
}

export const emeliaContactUtils = {
	stringifyValues,
	nonEmpty,
};
