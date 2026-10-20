function optionalStringList({
	value,
	propName,
}: {
	value: unknown[] | undefined;
	propName: string;
}): string[] | undefined {
	if (value === undefined) {
		return undefined;
	}
	if (!value.every((item): item is string => typeof item === 'string' && item !== '')) {
		throw new Error(`${propName} must be a list of non-empty strings.`);
	}
	return value;
}

function requiredStringList({
	value,
	propName,
}: {
	value: unknown[] | undefined;
	propName: string;
}): string[] {
	const list = optionalStringList({ value, propName });
	if (list === undefined || list.length === 0) {
		throw new Error(`${propName} must contain at least one item.`);
	}
	return list;
}

export const senderUtils = { optionalStringList, requiredStringList };
