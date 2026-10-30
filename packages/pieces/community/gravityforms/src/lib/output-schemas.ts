import { OutputSchema } from '@activepieces/pieces-framework';

const formFieldFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Field ID', format: 'number' },
  { key: 'type', label: 'Type' },
  { key: 'label', label: 'Label' },
  { key: 'adminLabel', label: 'Admin Label' },
  { key: 'description', label: 'Description' },
  { key: 'isRequired', label: 'Required', format: 'boolean' },
  { key: 'placeholder', label: 'Placeholder' },
  { key: 'defaultValue', label: 'Default Value' },
  { key: 'inputName', label: 'Parameter Name' },
  { key: 'inputType', label: 'Input Type' },
  { key: 'visibility', label: 'Visibility' },
  { key: 'pageNumber', label: 'Page Number', format: 'number' },
  { key: 'formId', label: 'Form ID', format: 'number' },
  { key: 'cssClass', label: 'CSS Class' },
  { key: 'maxLength', label: 'Max Length' },
  { key: 'noDuplicates', label: 'No Duplicates', format: 'boolean' },
  { key: 'allowsPrepopulate', label: 'Allows Prepopulate', format: 'boolean' },
  { key: 'errorMessage', label: 'Error Message' },
  { key: 'inputs', label: 'Inputs' },
  { key: 'choices', label: 'Choices' },
  { key: 'conditionalLogic', label: 'Conditional Logic' },
];

const formFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Form ID', format: 'number' },
  { key: 'title', label: 'Title' },
  { key: 'description', label: 'Description' },
  { key: 'fields', label: 'Fields', labelKey: 'label', listItems: formFieldFields },
  { key: 'notifications', label: 'Notifications', dynamicKey: true, labelKey: 'name' },
  {
    key: 'confirmations',
    label: 'Confirmations',
    dynamicKey: true,
    labelKey: 'name',
    children: [
      { key: 'id', label: 'Confirmation ID' },
      { key: 'name', label: 'Name' },
      { key: 'isDefault', label: 'Default', format: 'boolean' },
      { key: 'type', label: 'Type' },
      { key: 'message', label: 'Message', format: 'html' },
      { key: 'url', label: 'Redirect URL' },
      { key: 'pageId', label: 'Page ID' },
      { key: 'queryString', label: 'Query String' },
    ],
  },
  {
    key: 'button',
    label: 'Submit Button',
    children: [
      { key: 'type', label: 'Type' },
      { key: 'text', label: 'Text' },
    ],
  },
  { key: 'labelPlacement', label: 'Label Placement' },
  { key: 'descriptionPlacement', label: 'Description Placement' },
  { key: 'validationPlacement', label: 'Validation Placement' },
  { key: 'subLabelPlacement', label: 'Sub-Label Placement' },
  { key: 'requiredIndicator', label: 'Required Indicator' },
  { key: 'validationSummary', label: 'Validation Summary', format: 'boolean' },
  { key: 'columnLayout', label: 'Column Layout' },
  { key: 'nextFieldId', label: 'Next Field ID', format: 'number' },
  { key: 'is_active', label: 'Active' },
  { key: 'is_trash', label: 'In Trash' },
  { key: 'date_created', label: 'Created At', format: 'datetime' },
  { key: 'version', label: 'Gravity Forms Version' },
  { key: 'markupVersion', label: 'Markup Version', format: 'number' },
];

const entryFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Entry ID' },
  { key: 'form_id', label: 'Form ID' },
  { key: 'status', label: 'Status' },
  { key: 'date_created', label: 'Created At', format: 'datetime' },
  { key: 'date_updated', label: 'Updated At', format: 'datetime' },
  { key: 'created_by', label: 'Created By User ID' },
  { key: 'is_starred', label: 'Starred' },
  { key: 'is_read', label: 'Read' },
  { key: 'ip', label: 'IP Address' },
  { key: 'source_url', label: 'Source URL', format: 'url' },
  { key: 'user_agent', label: 'User Agent' },
  { key: 'post_id', label: 'Post ID' },
  { key: 'currency', label: 'Currency' },
  { key: 'payment_status', label: 'Payment Status' },
  { key: 'payment_date', label: 'Payment Date', format: 'datetime' },
  { key: 'payment_amount', label: 'Payment Amount' },
  { key: 'payment_method', label: 'Payment Method' },
  { key: 'transaction_id', label: 'Transaction ID' },
  { key: 'transaction_type', label: 'Transaction Type' },
  { key: 'is_fulfilled', label: 'Fulfilled' },
];

const feedFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Feed ID' },
  { key: 'form_id', label: 'Form ID' },
  { key: 'addon_slug', label: 'Add-on Slug' },
  { key: 'is_active', label: 'Active' },
  { key: 'feed_order', label: 'Order' },
  { key: 'event_type', label: 'Event Type' },
  { key: 'meta', label: 'Settings', children: [{ key: 'feedName', label: 'Feed Name' }] },
];

const submissionFields: OutputSchema['fields'] = [
  { key: 'is_valid', label: 'Valid', format: 'boolean' },
  { key: 'validation_messages', label: 'Validation Messages', dynamicKey: true },
  { key: 'page_number', label: 'Page Number', format: 'number' },
  { key: 'source_page_number', label: 'Source Page Number', format: 'number' },
  { key: 'is_spam', label: 'Spam', format: 'boolean' },
];

export const gravityformsListFormsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'forms',
      label: 'Forms',
      labelKey: 'title',
      listItems: [
        { key: 'id', label: 'Form ID' },
        { key: 'title', label: 'Title' },
        { key: 'entries', label: 'Entry Count' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const gravityformsGetFormOutputSchema: OutputSchema = { fields: formFields };

export const gravityformsCreateFormOutputSchema: OutputSchema = { fields: formFields };

export const gravityformsUpdateFormOutputSchema: OutputSchema = { fields: formFields };

export const gravityformsDeleteFormOutputSchema: OutputSchema = {
  fields: [
    { key: 'deleted', label: 'Permanently Deleted', format: 'boolean' },
    { key: 'previous', label: 'Form', children: formFields },
  ],
};

export const gravityformsSubmitFormOutputSchema: OutputSchema = {
  fields: [
    ...submissionFields.filter((field) => field.key !== 'validation_messages'),
    { key: 'confirmation_type', label: 'Confirmation Type' },
    { key: 'confirmation_message', label: 'Confirmation Message', format: 'html' },
  ],
};

export const gravityformsValidateSubmissionOutputSchema: OutputSchema = { fields: submissionFields };

export const gravityformsListFieldFiltersOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'field_filters',
      label: 'Field Filters',
      labelKey: 'text',
      listItems: [
        { key: 'key', label: 'Filter Key' },
        { key: 'text', label: 'Label' },
        { key: 'operators', label: 'Operators' },
        { key: 'preventMultiple', label: 'Prevent Multiple', format: 'boolean' },
        { key: 'placeholder', label: 'Placeholder' },
        { key: 'cssClass', label: 'CSS Class' },
        {
          key: 'values',
          label: 'Values',
          labelKey: 'text',
          listItems: [
            { key: 'text', label: 'Label' },
            { key: 'value', label: 'Value' },
          ],
        },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const gravityformsListEntriesOutputSchema: OutputSchema = {
  fields: [
    { key: 'total_count', label: 'Total Matching Entries', format: 'number' },
    { key: 'entries', label: 'Entries', labelKey: 'id', listItems: entryFields },
  ],
};

export const gravityformsGetEntryOutputSchema: OutputSchema = { fields: entryFields };

export const gravityformsCreateEntryOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Entry ID', format: 'number' },
    { key: 'form_id', label: 'Form ID', format: 'number' },
    { key: 'is_starred', label: 'Starred', format: 'number' },
  ],
};

export const gravityformsDeleteEntryOutputSchema: OutputSchema = {
  fields: [
    { key: 'deleted', label: 'Permanently Deleted', format: 'boolean' },
    { key: 'previous', label: 'Entry', children: entryFields },
  ],
};

export const gravityformsSendNotificationsOutputSchema: OutputSchema = {
  fields: [
    { key: 'notification_ids', label: 'Sent Notification IDs' },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const gravityformsListFeedsOutputSchema: OutputSchema = {
  fields: [
    { key: 'feeds', label: 'Feeds', labelKey: 'addon_slug', listItems: feedFields },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const gravityformsGetFeedOutputSchema: OutputSchema = { fields: feedFields };

export const gravityformsCreateFeedOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Feed ID', format: 'number' },
    { key: 'form_id', label: 'Form ID', format: 'number' },
    { key: 'addon_slug', label: 'Add-on Slug' },
    { key: 'meta', label: 'Settings', children: [{ key: 'feedName', label: 'Feed Name' }] },
  ],
};

export const gravityformsDeleteFeedOutputSchema: OutputSchema = {
  fields: [
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
    { key: 'previous', label: 'Feed', children: feedFields },
  ],
};

export const gravityformsGetFormResultsOutputSchema: OutputSchema = {
  fields: [
    { key: 'entry_count', label: 'Entry Count', format: 'number' },
    { key: 'status', label: 'Calculation Status' },
    { key: 'timestamp', label: 'Calculated At (Unix Seconds)', format: 'number' },
  ],
};
