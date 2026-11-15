import { OutputSchema } from '@activepieces/pieces-framework';

const formResponseAnswerFields: OutputSchema['fields'] = [
  { key: 'questionId', label: 'Question ID' },
  {
    key: 'textAnswers',
    label: 'Text Answers',
    children: [
      {
        key: 'answers',
        label: 'Values',
        listItems: [{ key: 'value', label: 'Value' }],
      },
    ],
  },
];

const formResponseFields: OutputSchema['fields'] = [
  { key: 'responseId', label: 'Response ID' },
  { key: 'createTime', label: 'Create Time', format: 'datetime' },
  { key: 'lastSubmittedTime', label: 'Last Submitted Time', format: 'datetime' },
  {
    key: 'answers',
    label: 'Answers',
    dynamicKey: true,
    labelKey: 'questionId',
    children: formResponseAnswerFields,
  },
];

const formItemFields: OutputSchema['fields'] = [
  { key: 'itemId', label: 'Item ID' },
  { key: 'title', label: 'Title' },
  {
    key: 'questionItem',
    label: 'Question',
    children: [
      {
        key: 'question',
        label: 'Question',
        children: [
          { key: 'questionId', label: 'Question ID' },
          { key: 'required', label: 'Required', format: 'boolean' },
        ],
      },
    ],
  },
];

export const formsGetFormActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'formId', label: 'Form ID' },
    {
      key: 'info',
      label: 'Info',
      children: [
        { key: 'title', label: 'Title' },
        { key: 'documentTitle', label: 'Document Title' },
      ],
    },
    {
      key: 'settings',
      label: 'Settings',
      children: [{ key: 'emailCollectionType', label: 'Email Collection Type' }],
    },
    { key: 'revisionId', label: 'Revision ID' },
    { key: 'responderUri', label: 'Responder Link', format: 'url' },
    {
      key: 'items',
      label: 'Items',
      labelKey: 'title',
      listItems: formItemFields,
    },
    {
      key: 'publishSettings',
      label: 'Publish Settings',
      children: [
        {
          key: 'publishState',
          label: 'Publish State',
          children: [
            { key: 'isPublished', label: 'Is Published', format: 'boolean' },
            { key: 'isAcceptingResponses', label: 'Is Accepting Responses', format: 'boolean' },
          ],
        },
      ],
    },
  ],
};

export const formsGetResponseActionOutputSchema: OutputSchema = {
  fields: [{ key: 'formId', label: 'Form ID' }, ...formResponseFields],
};

export const formsListResponsesActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'responses',
      label: 'Responses',
      labelKey: 'responseId',
      listItems: formResponseFields,
    },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'nextPageToken', label: 'Next Page Token' },
  ],
};

export const newResponseTriggerOutputSchema: OutputSchema = {
  fields: formResponseFields,
};
