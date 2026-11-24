export enum TeableFieldType {
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

export const TeableComputedFieldTypes: string[] = [
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

export const TeableCreatableFieldTypes: string[] = [
  TeableFieldType.SINGLE_LINE_TEXT,
  TeableFieldType.LONG_TEXT,
  TeableFieldType.USER,
  TeableFieldType.ATTACHMENT,
  TeableFieldType.CHECKBOX,
  TeableFieldType.MULTIPLE_SELECT,
  TeableFieldType.SINGLE_SELECT,
  TeableFieldType.DATE,
  TeableFieldType.NUMBER,
  TeableFieldType.RATING,
  TeableFieldType.FORMULA,
  TeableFieldType.LINK,
  TeableFieldType.CREATED_TIME,
  TeableFieldType.LAST_MODIFIED_TIME,
  TeableFieldType.CREATED_BY,
  TeableFieldType.LAST_MODIFIED_BY,
  TeableFieldType.AUTO_NUMBER,
];

export const TEABLE_CLOUD_URL = 'https://app.teable.ai';

export const TEABLE_MAX_PAGE_SIZE = 1000;

export const TeableCreatableFieldTypeOptions: { label: string; value: string }[] = [
  { label: 'Single line text', value: TeableFieldType.SINGLE_LINE_TEXT },
  { label: 'Long text', value: TeableFieldType.LONG_TEXT },
  { label: 'User', value: TeableFieldType.USER },
  { label: 'Attachment', value: TeableFieldType.ATTACHMENT },
  { label: 'Checkbox', value: TeableFieldType.CHECKBOX },
  { label: 'Multiple select', value: TeableFieldType.MULTIPLE_SELECT },
  { label: 'Single select', value: TeableFieldType.SINGLE_SELECT },
  { label: 'Date', value: TeableFieldType.DATE },
  { label: 'Number', value: TeableFieldType.NUMBER },
  { label: 'Rating', value: TeableFieldType.RATING },
  { label: 'Formula', value: TeableFieldType.FORMULA },
  { label: 'Link', value: TeableFieldType.LINK },
  { label: 'Created time', value: TeableFieldType.CREATED_TIME },
  { label: 'Last modified time', value: TeableFieldType.LAST_MODIFIED_TIME },
  { label: 'Created by', value: TeableFieldType.CREATED_BY },
  { label: 'Last modified by', value: TeableFieldType.LAST_MODIFIED_BY },
  { label: 'Auto number', value: TeableFieldType.AUTO_NUMBER },
];
