import { OutputSchema } from '@activepieces/pieces-framework';

const formFields: OutputSchema['fields'] = [
  { key: 'name', label: 'Name' },
  { key: 'formId', label: 'Form ID' },
  { key: 'id', label: 'Numeric ID' },
  { key: 'isPublished', label: 'Is Published', format: 'boolean' },
  { key: 'tags', label: 'Tags' },
];

export const findFormByTitleActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'found', label: 'Found', format: 'boolean' },
    { key: 'result', label: 'Matching Forms', labelKey: 'name', listItems: formFields },
  ],
};

const submissionCoreFields: OutputSchema['fields'] = [
  { key: 'submissionId', label: 'Submission ID' },
  { key: 'submissionTime', label: 'Submission Time', format: 'datetime' },
  {
    key: 'questions', label: 'Questions', labelKey: 'name',
    listItems: [
      { key: 'id', label: 'Question ID' },
      { key: 'name', label: 'Question Name' },
      { key: 'type', label: 'Question Type' },
      { key: 'value', label: 'Answer' },
    ],
  },
  {
    key: 'calculations', label: 'Calculations', labelKey: 'name',
    listItems: [
      { key: 'id', label: 'Calculation ID' },
      { key: 'name', label: 'Calculation Name' },
      { key: 'type', label: 'Calculation Type' },
      { key: 'value', label: 'Value' },
    ],
  },
  {
    key: 'urlParameters', label: 'URL Parameters', labelKey: 'name',
    listItems: [
      { key: 'id', label: 'Parameter ID' },
      { key: 'name', label: 'Parameter Name' },
      { key: 'value', label: 'Value' },
    ],
  },
];

const submissionFields: OutputSchema['fields'] = [
  ...submissionCoreFields,
  { key: 'lastUpdatedAt', label: 'Last Updated At', format: 'datetime' },
  { key: 'startedAt', label: 'Started At', format: 'datetime' },
  { key: 'editLink', label: 'Edit Link', format: 'url' },
];

export const getFormResponsesActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'totalResponses', label: 'Total Responses', format: 'number' },
    { key: 'pageCount', label: 'Page Count', format: 'number' },
    { key: 'responses', label: 'Responses', labelKey: 'submissionId', listItems: submissionFields },
  ],
};

export const getSingleResponseActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'submission', label: 'Submission', children: submissionFields },
  ],
};

export const newFormResponseTriggerOutputSchema: OutputSchema = {
  itemLabel: 'Submission {submissionId}',
  fields: [
    { key: 'submissions', label: 'Submissions', value: '', listItems: submissionCoreFields },
  ],
};
