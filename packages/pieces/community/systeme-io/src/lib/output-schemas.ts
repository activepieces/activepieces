import { OutputSchema, OutputSchemaField } from '@activepieces/pieces-framework';

const contactFields: OutputSchema['fields'] = [
  {
    key: 'id',
    label: 'Contact ID',
    description: 'Use this to add tags to, update, or remove tags from the contact in a later step.',
  },
  {
    key: 'email',
    label: 'Email',
    format: 'email',
  },
  {
    key: 'registeredAt',
    label: 'Registered At',
    format: 'datetime',
  },
  {
    key: 'locale',
    label: 'Locale',
  },
  {
    key: 'fields',
    label: 'Contact Fields',
    labelKey: 'fieldName',
    description:
      'The contact\'s field values. Which fields exist depends on the account, so this list varies.',
    listItems: [
      { key: 'fieldName', label: 'Field Name', description: 'Human name, for example "Phone number".' },
      { key: 'slug', label: 'Slug', description: 'The identifier to use when updating this field.' },
      { key: 'value', label: 'Value' },
    ],
  },
  {
    key: 'unsubscribed',
    label: 'Unsubscribed',
    format: 'boolean',
  },
  {
    key: 'bounced',
    label: 'Bounced',
    format: 'boolean',
  },
  {
    key: 'needsConfirmation',
    label: 'Needs Confirmation',
    format: 'boolean',
  },
  {
    key: 'sourceURL',
    label: 'Source URL',
    format: 'url',
    description: 'Where the contact signed up, when Systeme.io recorded it.',
  },
];

const tagListField: OutputSchemaField = {
  key: 'tags',
  label: 'Tags',
  labelKey: 'name',
  listItems: [
    { key: 'id', label: 'Tag ID' },
    { key: 'name', label: 'Name' },
  ],
};

const contactFieldsWithTags: OutputSchema['fields'] = [...contactFields, tagListField];

export const createContactActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'contact',
      label: 'Contact',
      description:
        'The newly created contact. Its Tags list is empty even when tags were requested, because Systeme.io returns the contact before the tags are attached — read Tag Results instead.',
      children: contactFields,
    },
    {
      key: 'tagResults',
      label: 'Tag Results',
      labelKey: 'tagName',
      description: 'One entry per tag the action tried to attach.',
      listItems: [
        { key: 'tagId', label: 'Tag ID' },
        { key: 'tagName', label: 'Tag Name', description: 'Only set when a new tag was created.' },
        { key: 'success', label: 'Attached', format: 'boolean' },
        { key: 'error', label: 'Error', description: 'Only present when this tag failed to attach.' },
      ],
    },
    {
      key: 'totalTagsAssigned',
      label: 'Tags Assigned',
      format: 'number',
    },
    {
      key: 'newTagsCreated',
      label: 'New Tags Created',
      format: 'number',
    },
    {
      key: 'tagSource',
      label: 'Tag Source',
      description: 'Which tag option the step ran with: "existing", "new", or "none".',
    },
    {
      key: 'dynamicFieldsProcessed',
      label: 'Contact Fields Set',
      format: 'number',
    },
    {
      key: 'customFieldsProcessed',
      label: 'Custom Fields Set',
      format: 'number',
    },
  ],
};

export const findContactByEmailActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'success',
      label: 'Found',
      format: 'boolean',
      description: 'False when no contact has that email, in which case Contact is empty.',
    },
    {
      key: 'contact',
      label: 'Contact',
      children: contactFieldsWithTags,
    },
    {
      key: 'message',
      label: 'Message',
    },
  ],
};

export const updateContactActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'success',
      label: 'Updated',
      format: 'boolean',
      description: 'False when no fields were supplied, in which case nothing was changed.',
    },
    {
      key: 'contactId',
      label: 'Contact ID',
    },
    {
      key: 'updatedFields',
      label: 'Updated Fields',
      labelKey: 'slug',
      description: 'The field values that were written.',
      listItems: [
        { key: 'slug', label: 'Slug' },
        { key: 'value', label: 'Value' },
      ],
    },
    {
      key: 'response',
      label: 'Contact',
      description: 'The contact as it stands after the update.',
      children: contactFieldsWithTags,
    },
    {
      key: 'dynamicFieldsProcessed',
      label: 'Contact Fields Set',
      format: 'number',
    },
    {
      key: 'customFieldsProcessed',
      label: 'Custom Fields Set',
      format: 'number',
    },
    {
      key: 'message',
      label: 'Message',
      description: 'Only set when the step made no change because no fields were supplied.',
    },
  ],
};

export const addTagToContactActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Attached', format: 'boolean' },
    { key: 'contactId', label: 'Contact ID' },
    { key: 'tagId', label: 'Tag ID' },
    {
      key: 'tagCreated',
      label: 'Tag Was Created',
      format: 'boolean',
      description: 'True when the step created a new tag rather than attaching an existing one.',
    },
    {
      key: 'tagName',
      label: 'Tag Name',
      description: 'Only set when a new tag was created; attaching an existing tag leaves it empty.',
    },
    { key: 'message', label: 'Message' },
  ],
};

export const removeTagFromContactActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Removed', format: 'boolean' },
    { key: 'contactId', label: 'Contact ID' },
    { key: 'tagId', label: 'Tag ID' },
    {
      key: 'tagName',
      label: 'Tag Name',
      description: 'Falls back to "Unknown Tag" if the tag could not be looked up before removal.',
    },
    { key: 'message', label: 'Message' },
  ],
};

export const newContactTriggerOutputSchema: OutputSchema = { fields: contactFields };

export const newTagAddedToContactTriggerOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'tag',
      label: 'Tag',
      description: 'The tag that was just attached.',
      children: [
        { key: 'id', label: 'Tag ID' },
        { key: 'name', label: 'Name' },
      ],
    },
    {
      key: 'contact',
      label: 'Contact',
      description: 'The contact it was attached to, including its other tags.',
      children: contactFieldsWithTags,
    },
  ],
};
