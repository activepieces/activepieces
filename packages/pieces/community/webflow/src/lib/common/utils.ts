import type { WebflowCollectionField } from './types';

function formatFieldData({
	fields,
	values,
}: {
	fields: WebflowCollectionField[];
	values: Record<string, unknown>;
}): Record<string, unknown> {
	return fields.reduce<Record<string, unknown>>((fieldData, field) => {
		const value = values[field.slug];
		if (value === undefined || value === '') {
			return fieldData;
		}
		switch (field.type) {
			case 'Image':
			case 'File':
				return { ...fieldData, [field.slug]: { url: value } };
			case 'MultiImage':
				return Array.isArray(value) && value.length > 0
					? { ...fieldData, [field.slug]: value.map((url) => ({ url })) }
					: fieldData;
			case 'MultiReference':
				return Array.isArray(value) && value.length > 0 ? { ...fieldData, [field.slug]: value } : fieldData;
			case 'Number':
				return { ...fieldData, [field.slug]: Number(value) };
			case 'Option': {
				const option = field.validations?.options?.find((candidate) => candidate.name === value || candidate.id === value);
				return { ...fieldData, [field.slug]: option ? option.id : value };
			}
			default:
				return { ...fieldData, [field.slug]: value };
		}
	}, {});
}

export const webflowUtils = { formatFieldData };
