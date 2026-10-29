function optionalStringList({ value, propName }: StringListParams): string[] | undefined {
	if (value === undefined || value === null) {
		return undefined;
	}
	if (!value.every((item): item is string => typeof item === 'string' && item !== '')) {
		throw new Error(`${propName} must be a list of non-empty text values.`);
	}
	return value;
}

function requiredStringList({ value, propName }: StringListParams): string[] {
	const list = optionalStringList({ value, propName });
	if (list === undefined || list.length === 0) {
		throw new Error(`${propName} must contain at least one value.`);
	}
	return list;
}

export const zohoDeskUtils = { optionalStringList, requiredStringList };

type StringListParams = { value: unknown[] | undefined | null; propName: string };
