const builtInTextFields = ['FirstName', 'LastName'];

function toStringArray({
	value,
	propName,
}: {
	value: unknown[] | undefined;
	propName: string;
}): string[] {
	if (value === undefined) {
		return [];
	}
	if (!value.every((item): item is string => typeof item === 'string' && item !== '')) {
		throw new Error(`${propName} must be a list of non-empty strings.`);
	}
	return value;
}

function toTagChanges({
	tagsToAdd,
	tagsToRemove,
}: {
	tagsToAdd: string[];
	tagsToRemove: string[];
}): Record<string, boolean> | undefined {
	if (tagsToAdd.length === 0 && tagsToRemove.length === 0) {
		return undefined;
	}
	const overlap = tagsToAdd.filter((tag) => tagsToRemove.includes(tag));
	if (overlap.length > 0) {
		throw new Error(`Tags to Add and Tags to Remove both contain: ${overlap.join(', ')}.`);
	}
	return {
		...Object.fromEntries(tagsToAdd.map((tag) => [tag, true])),
		...Object.fromEntries(tagsToRemove.map((tag) => [tag, false])),
	};
}

function toFieldChanges({
	fields,
	fieldsToClear,
}: {
	fields: Record<string, unknown> | undefined;
	fieldsToClear: string[];
}): Record<string, unknown> | undefined {
	if (fields === undefined && fieldsToClear.length === 0) {
		return undefined;
	}
	const overlap = fieldsToClear.filter((tag) => fields !== undefined && tag in fields);
	if (overlap.length > 0) {
		throw new Error(`Fields and Fields to Clear both contain: ${overlap.join(', ')}.`);
	}
	return {
		...fields,
		...Object.fromEntries(
			fieldsToClear.map((tag) => [tag, builtInTextFields.includes(tag) ? '' : null]),
		),
	};
}

export const emailOctopusUtils = { toStringArray, toTagChanges, toFieldChanges };
