import { OutputSchema, OutputSchemaField } from '@activepieces/pieces-framework';

const surveySummaryFields: OutputSchemaField[] = [
  { key: 'id', label: 'Survey ID' },
  { key: 'name', label: 'Name' },
  { key: 'status', label: 'Status', description: 'draft, scheduled, inProgress, paused or completed.' },
  { key: 'type', label: 'Type', description: 'link or app.' },
  { key: 'workspaceId', label: 'Workspace ID' },
  { key: 'questionCount', label: 'Question Count', format: 'number' },
  { key: 'createdAt', label: 'Created At', format: 'datetime' },
  { key: 'updatedAt', label: 'Updated At', format: 'datetime' },
];

const surveyDetailFields: OutputSchemaField[] = [
  ...surveySummaryFields,
  {
    key: 'questions',
    label: 'Questions',
    labelKey: 'headline',
    listItems: [
      { key: 'id', label: 'Question ID', description: 'The key used for this question in a response\'s answers.' },
      { key: 'type', label: 'Question Type' },
      { key: 'headline', label: 'Headline' },
      { key: 'required', label: 'Required', format: 'boolean' },
    ],
  },
];

const responseFields: OutputSchemaField[] = [
  { key: 'id', label: 'Response ID' },
  { key: 'surveyId', label: 'Survey ID' },
  { key: 'finished', label: 'Finished', format: 'boolean' },
  { key: 'data', label: 'Answers', dynamicKey: true, description: 'Answers keyed by question ID.' },
  { key: 'variables', label: 'Variables', dynamicKey: true },
  { key: 'contactId', label: 'Contact ID' },
  { key: 'contactAttributes', label: 'Contact Attributes', dynamicKey: true },
  {
    key: 'meta',
    label: 'Meta',
    children: [
      { key: 'source', label: 'Source' },
      { key: 'url', label: 'Page URL', format: 'url' },
      { key: 'pagePath', label: 'Page Path' },
      { key: 'locale', label: 'Locale' },
      { key: 'timezone', label: 'Time Zone' },
      { key: 'country', label: 'Country' },
      { key: 'action', label: 'Action' },
      { key: 'userAgent', label: 'User Agent', children: [
        { key: 'browser', label: 'Browser' },
        { key: 'os', label: 'Operating System' },
        { key: 'device', label: 'Device' },
      ] },
    ],
  },
  { key: 'language', label: 'Language' },
  { key: 'endingId', label: 'Ending ID' },
  { key: 'createdAt', label: 'Created At', format: 'datetime' },
  { key: 'updatedAt', label: 'Updated At', format: 'datetime' },
];

const attributeKeyFields: OutputSchemaField[] = [
  { key: 'id', label: 'Attribute Key ID' },
  { key: 'key', label: 'Key' },
  { key: 'name', label: 'Name' },
  { key: 'description', label: 'Description' },
  { key: 'type', label: 'Type', description: 'default or custom.' },
  { key: 'dataType', label: 'Data Type' },
  { key: 'isUnique', label: 'Unique', format: 'boolean' },
  { key: 'workspaceId', label: 'Workspace ID' },
  { key: 'createdAt', label: 'Created At', format: 'datetime' },
];

const contactFields: OutputSchemaField[] = [
  { key: 'id', label: 'Contact ID' },
  { key: 'email', label: 'Email', format: 'email' },
  { key: 'userId', label: 'User ID' },
  { key: 'firstName', label: 'First Name' },
  { key: 'lastName', label: 'Last Name' },
  { key: 'attributes', label: 'All Attributes', dynamicKey: true },
];

const listSurveys: OutputSchema = {
  fields: [
    { key: 'surveys', label: 'Surveys', labelKey: 'name', listItems: surveySummaryFields },
    { key: 'count', label: 'Count', format: 'number' },
    {
      key: 'truncated',
      label: 'More Available',
      format: 'boolean',
      description: 'True when more surveys matched than the limit, or when the 1,000-survey scan cap was reached and the list may be incomplete.',
    },
    {
      key: 'scan_limit_reached',
      label: 'Scan Limit Reached',
      format: 'boolean',
      description: 'True when the piece stopped after scanning 1,000 surveys; surveys beyond that are not included.',
    },
  ],
};

const surveyDetail: OutputSchema = { fields: surveyDetailFields };

const listResponses: OutputSchema = {
  fields: [
    { key: 'responses', label: 'Responses', labelKey: 'id', listItems: responseFields },
    { key: 'total', label: 'Total Matches', format: 'number' },
    { key: 'limit', label: 'Limit', format: 'number' },
    { key: 'skip', label: 'Skipped', format: 'number' },
    { key: 'has_more', label: 'Has More', format: 'boolean' },
  ],
};

const response: OutputSchema = { fields: responseFields };

const deleted: OutputSchema = {
  fields: [
    { key: 'id', label: 'ID' },
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
  ],
};

const listAttributeKeys: OutputSchema = {
  fields: [
    { key: 'keys', label: 'Attribute Keys', labelKey: 'key', listItems: attributeKeyFields },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

const attributeKey: OutputSchema = { fields: attributeKeyFields };

const findContact: OutputSchema = {
  fields: [
    { key: 'found', label: 'Found', format: 'boolean' },
    { key: 'contact', label: 'Contact', children: contactFields },
  ],
};

const upsertContact: OutputSchema = {
  fields: [
    { key: 'status', label: 'Status' },
    { key: 'message', label: 'Message' },
    { key: 'contact', label: 'Contact', children: contactFields },
  ],
};

const listActionClasses: OutputSchema = {
  fields: [
    {
      key: 'actionClasses',
      label: 'Action Classes',
      labelKey: 'name',
      listItems: [
        { key: 'id', label: 'Action Class ID' },
        { key: 'name', label: 'Name' },
        { key: 'description', label: 'Description' },
        { key: 'type', label: 'Type', description: 'code, noCode or automatic.' },
        { key: 'key', label: 'Key', description: 'The key to track for code actions.' },
        { key: 'workspaceId', label: 'Workspace ID' },
        { key: 'createdAt', label: 'Created At', format: 'datetime' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

const contactSurveyLink: OutputSchema = {
  fields: [
    { key: 'surveyUrl', label: 'Survey Link', format: 'url' },
    { key: 'expiresAt', label: 'Expires At', format: 'datetime', description: 'Empty when the link never expires.' },
    { key: 'surveyId', label: 'Survey ID' },
    { key: 'contactId', label: 'Contact ID' },
  ],
};

const webhookEvent: OutputSchema = {
  fields: [
    { key: 'webhookId', label: 'Webhook ID' },
    { key: 'event', label: 'Event' },
    {
      key: 'data',
      label: 'Response',
      children: [
        ...responseFields.filter((field) => field.key !== 'contactId'),
        {
          key: 'contact',
          label: 'Contact',
          description: 'Empty for anonymous responses.',
          children: [
            { key: 'id', label: 'Contact ID' },
            { key: 'userId', label: 'User ID' },
          ],
        },
        { key: 'displayId', label: 'Display ID' },
        {
          key: 'survey',
          label: 'Survey',
          children: [
            { key: 'title', label: 'Title' },
            { key: 'type', label: 'Type' },
            { key: 'status', label: 'Status' },
          ],
        },
        { key: 'tags', label: 'Tags', labelKey: 'name', listItems: [
          { key: 'id', label: 'Tag ID' },
          { key: 'name', label: 'Name' },
        ] },
      ],
    },
  ],
};

export const formbricksSchemas = {
  listSurveys,
  surveyDetail,
  listResponses,
  response,
  deleted,
  listAttributeKeys,
  attributeKey,
  findContact,
  upsertContact,
  listActionClasses,
  contactSurveyLink,
  webhookEvent,
};
