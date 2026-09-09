import { OutputSchema, OutputSchemaField } from '@activepieces/pieces-framework';

const submissionDataField: OutputSchemaField = {
  key: 'data',
  label: 'Submitted Data',
  description:
    'The submitted values, keyed by the form component keys. The shape depends on the form, so expand it after a test run to see this form fields.',
};

const submissionMetadataField: OutputSchemaField = {
  key: 'metadata',
  label: 'Metadata',
  description:
    'What Form.io recorded about the request that created the submission. Form.io keeps only a safe subset of the headers.',
  children: [
    {
      key: 'headers',
      label: 'Request Headers',
      children: [
        { key: 'host', label: 'Host' },
        { key: 'user-agent', label: 'User Agent' },
        { key: 'content-type', label: 'Content Type' },
        { key: 'content-length', label: 'Content Length' },
      ],
    },
  ],
};

const submissionFields: OutputSchemaField[] = [
  { key: '_id', label: 'Submission ID' },
  { key: 'form', label: 'Form ID' },
  submissionDataField,
  { key: 'owner', label: 'Owner' },
  { key: 'roles', label: 'Roles' },
  { key: 'access', label: 'Access' },
  { key: 'externalIds', label: 'External IDs' },
  submissionMetadataField,
  { key: 'created', label: 'Created', format: 'datetime' },
  { key: 'modified', label: 'Modified', format: 'datetime' },
];

const formFields: OutputSchemaField[] = [
  { key: '_id', label: 'Form ID' },
  { key: 'title', label: 'Title' },
  { key: 'name', label: 'Name' },
  { key: 'path', label: 'Path' },
  { key: 'type', label: 'Type' },
  { key: 'display', label: 'Display' },
  { key: 'machineName', label: 'Machine Name' },
  { key: 'owner', label: 'Owner' },
  { key: 'tags', label: 'Tags' },
  {
    key: 'components',
    label: 'Components',
    labelKey: 'label',
    description: 'The fields the form is built from.',
    listItems: [
      { key: 'key', label: 'Key' },
      { key: 'label', label: 'Label' },
      { key: 'type', label: 'Type' },
      { key: 'input', label: 'Is Input', format: 'boolean' },
    ],
  },
  {
    key: 'access',
    label: 'Access',
    labelKey: 'type',
    listItems: [
      { key: 'type', label: 'Type' },
      { key: 'roles', label: 'Roles' },
    ],
  },
  { key: 'submissionAccess', label: 'Submission Access' },
  { key: 'created', label: 'Created', format: 'datetime' },
  { key: 'modified', label: 'Modified', format: 'datetime' },
];

export const createSubmissionOutputSchema: OutputSchema = {
  fields: submissionFields,
};

export const getSubmissionOutputSchema: OutputSchema = {
  fields: submissionFields,
};

export const updateSubmissionOutputSchema: OutputSchema = {
  fields: submissionFields,
};

export const findSubmissionsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'submissions',
      label: 'Submissions',
      listItems: submissionFields,
    },
    {
      key: 'count',
      label: 'Returned Count',
      format: 'number',
      description: 'How many submissions this step returned.',
    },
    {
      key: 'total',
      label: 'Total Matching',
      format: 'number',
      description:
        'How many submissions match in the whole form, which can exceed the returned count when a limit is set.',
    },
  ],
};

export const deleteSubmissionOutputSchema: OutputSchema = {
  fields: [
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
    { key: 'submissionId', label: 'Submission ID' },
  ],
};

export const listFormsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'forms',
      label: 'Forms',
      labelKey: 'title',
      listItems: formFields,
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const getFormOutputSchema: OutputSchema = {
  fields: formFields,
};

export const submissionTriggerOutputSchema: OutputSchema = {
  fields: [
    ...submissionFields,
    {
      key: 'deleted',
      label: 'Deleted At',
      description: 'Set only once the submission has been deleted.',
    },
  ],
};
