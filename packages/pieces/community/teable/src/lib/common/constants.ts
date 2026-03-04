// Teable field types as returned by GET /api/table/{tableId}/field
// @see https://help.teable.ai/en/api-reference/field/list-fields
export const enum TeableFieldType {
	SINGLE_LINE_TEXT = 'singleLineText',
	LONG_TEXT = 'longText',
	USER = 'user',
	CHECKBOX = 'checkbox',
	MULTIPLE_SELECT = 'multipleSelect',
	SINGLE_SELECT = 'singleSelect',
	DATE = 'date',
	NUMBER = 'number',
	RATING = 'rating',
	LINK = 'link',
	// Computed — read-only, excluded from create/update
	ATTACHMENT = 'attachment',
	FORMULA = 'formula',
	ROLLUP = 'rollup',
	CONDITIONAL_ROLLUP = 'conditionalRollup',
	CREATED_TIME = 'createdTime',
	LAST_MODIFIED_TIME = 'lastModifiedTime',
	CREATED_BY = 'createdBy',
	LAST_MODIFIED_BY = 'lastModifiedBy',
	AUTO_NUMBER = 'autoNumber',
	BUTTON = 'button',
}

export const TeableNumericFieldTypes: string[] = [
	TeableFieldType.NUMBER,
	TeableFieldType.RATING,
];

export const TeableComputedFieldTypes: string[] = [
	TeableFieldType.ATTACHMENT,
	TeableFieldType.FORMULA,
	TeableFieldType.ROLLUP,
	TeableFieldType.CONDITIONAL_ROLLUP,
	TeableFieldType.CREATED_TIME,
	TeableFieldType.LAST_MODIFIED_TIME,
	TeableFieldType.CREATED_BY,
	TeableFieldType.LAST_MODIFIED_BY,
	TeableFieldType.AUTO_NUMBER,
	TeableFieldType.BUTTON,
];
