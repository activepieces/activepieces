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

export const newContactTriggerOutputSchema: OutputSchema = { fields: contactFieldsWithTags };

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

const tagFields: OutputSchemaField[] = [
  { key: 'id', label: 'Tag ID', description: 'Use this to tag or untag contacts in a later step.' },
  { key: 'name', label: 'Name' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
];

export const findContactsActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'contacts',
      label: 'Contacts',
      labelKey: 'email',
      listItems: contactFieldsWithTags,
    },
    { key: 'count', label: 'Returned', format: 'number' },
    {
      key: 'has_more',
      label: 'More Available',
      format: 'boolean',
      description: 'True when more contacts match than were returned.',
    },
    {
      key: 'next_cursor',
      label: 'Next Cursor',
      description: 'Pass this as "Continue After" to fetch the next contacts. Empty when there are no more.',
    },
  ],
};

export const getContactActionOutputSchema: OutputSchema = { fields: contactFieldsWithTags };

export const deleteResultOutputSchema: OutputSchema = {
  fields: [
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
    {
      key: 'not_found',
      label: 'Already Gone',
      format: 'boolean',
      description: 'True when the record did not exist (already deleted), so nothing changed.',
    },
    { key: 'id', label: 'ID' },
  ],
};

export const createTagActionOutputSchema: OutputSchema = {
  fields: [
    ...tagFields,
    {
      key: 'created',
      label: 'Was Created',
      format: 'boolean',
      description: 'False when a tag with this name already existed and was returned instead.',
    },
  ],
};

const enrollmentFields: OutputSchemaField[] = [
  { key: 'id', label: 'Enrollment ID' },
  {
    key: 'access_type',
    label: 'Access Type',
    description: 'full_access, partial_access, dripping_content or partial_dripping_access.',
  },
  { key: 'active', label: 'Active', format: 'boolean' },
  { key: 'course_id', label: 'Course ID' },
  { key: 'course_name', label: 'Course Name' },
  { key: 'contact_id', label: 'Contact ID' },
  { key: 'contact_email', label: 'Contact Email', format: 'email' },
];

export const enrollmentOutputSchema: OutputSchema = { fields: enrollmentFields };

export const removalResultOutputSchema: OutputSchema = {
  fields: [
    { key: 'removed', label: 'Removed', format: 'boolean' },
    { key: 'removed_count', label: 'Removed Count', format: 'number' },
    {
      key: 'removed_ids',
      label: 'Removed IDs',
      description: 'The enrollment or membership ids that were deleted.',
    },
    {
      key: 'not_found',
      label: 'Nothing to Remove',
      format: 'boolean',
      description: 'True when the contact had no matching enrollment or membership, so nothing changed.',
    },
  ],
};

export const addToCommunityOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'queued',
      label: 'Queued',
      format: 'boolean',
      description: 'Systeme.io accepted the request and adds the member in the background.',
    },
    { key: 'community_id', label: 'Community ID' },
    { key: 'contact_id', label: 'Contact ID' },
  ],
};

export const cancelSubscriptionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'cancelled',
      label: 'Cancelled',
      format: 'boolean',
      description: 'True when Systeme.io accepted the cancellation. With "At the end of the billing period" the subscription stays active until the period ends.',
    },
    {
      key: 'already_cancelled',
      label: 'Was Already Cancelled',
      format: 'boolean',
      description: 'True when the subscription was already cancelled, or already set to end with the period, so nothing changed.',
    },
    { key: 'subscription_id', label: 'Subscription ID' },
    { key: 'contact_id', label: 'Contact ID' },
    { key: 'cancel_type', label: 'When', description: 'Now or WhenBillingPeriodEnds.' },
  ],
};

const pricePlanFields: OutputSchemaField[] = [
  { key: 'id', label: 'Price Plan ID' },
  { key: 'name', label: 'Name' },
  { key: 'innerName', label: 'Internal Name' },
  { key: 'type', label: 'Type', description: 'For example one_shot or subscription.' },
  {
    key: 'amount',
    label: 'Amount',
    format: 'number',
    description: 'Unverified: most likely in the smallest currency unit (cents).',
  },
  { key: 'currency', label: 'Currency' },
  {
    key: 'recurringOptions',
    label: 'Recurring Options',
    description: 'Empty for one-off prices.',
    children: [
      { key: 'interval', label: 'Interval' },
      { key: 'intervalCount', label: 'Interval Count', format: 'number' },
      { key: 'trialPeriod', label: 'Trial Period', format: 'number' },
      { key: 'trialInterval', label: 'Trial Interval' },
      { key: 'limitOfPayments', label: 'Limit of Payments', format: 'number' },
    ],
  },
];

export const saleTriggerOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'customer',
      label: 'Customer',
      children: [
        { key: 'contactId', label: 'Contact ID', description: 'Use this with the contact actions.' },
        { key: 'email', label: 'Email', format: 'email' },
        { key: 'id', label: 'Customer ID' },
        {
          key: 'fields',
          label: 'Form Fields',
          dynamicKey: true,
          description: 'Values the buyer entered, keyed by field slug (e.g. first_name, surname, country).',
        },
        { key: 'paymentProcessor', label: 'Payment Processor' },
        { key: 'sourceUrl', label: 'Source URL', format: 'url' },
        { key: 'clientIp', label: 'IP Address' },
      ],
    },
    {
      key: 'order',
      label: 'Order',
      children: [
        { key: 'id', label: 'Order ID' },
        { key: 'createdAt', label: 'Created At', format: 'datetime' },
        { key: 'totalPrice', label: 'Total Price', format: 'number' },
        { key: 'vat', label: 'VAT', format: 'number' },
        { key: 'shippingFee', label: 'Shipping Fee', format: 'number' },
        { key: 'discountAmount', label: 'Discount Amount', format: 'number' },
        { key: 'discountType', label: 'Discount Type' },
      ],
    },
    {
      key: 'orderItem',
      label: 'Order Item',
      children: [
        { key: 'id', label: 'Order Item ID' },
        { key: 'createdAt', label: 'Created At', format: 'datetime' },
        {
          key: 'resources',
          label: 'Resources',
          description: 'What the purchase grants: a course, course bundle, physical product or tag.',
          listItems: [
            { key: 'course', label: 'Course', children: [{ key: 'id', label: 'Course ID' }, { key: 'name', label: 'Name' }] },
            {
              key: 'courseBundle',
              label: 'Course Bundle',
              children: [{ key: 'id', label: 'Bundle ID' }, { key: 'name', label: 'Name' }],
            },
            { key: 'enrollmentAccessType', label: 'Enrollment Access Type' },
            {
              key: 'physicalProduct',
              label: 'Physical Product',
              children: [{ key: 'id', label: 'Product ID' }, { key: 'name', label: 'Name' }],
            },
            { key: 'tag', label: 'Tag', children: [{ key: 'id', label: 'Tag ID' }, { key: 'name', label: 'Name' }] },
          ],
        },
      ],
    },
    { key: 'pricePlan', label: 'Price Plan', children: pricePlanFields },
    {
      key: 'funnelStep',
      label: 'Funnel Step',
      children: [
        { key: 'id', label: 'Funnel Step ID' },
        { key: 'name', label: 'Name' },
        { key: 'type', label: 'Type' },
        { key: 'funnel', label: 'Funnel', children: [{ key: 'id', label: 'Funnel ID' }, { key: 'name', label: 'Name' }] },
      ],
    },
    {
      key: 'coupon',
      label: 'Coupon',
      description: 'Empty when no coupon was used.',
      children: [
        { key: 'code', label: 'Code' },
        { key: 'innerName', label: 'Internal Name' },
        { key: 'discountAmount', label: 'Discount Amount', format: 'number' },
        { key: 'discountType', label: 'Discount Type' },
        { key: 'expirationDate', label: 'Expires At', format: 'datetime' },
        { key: 'limitOfUse', label: 'Limit of Use', format: 'number' },
      ],
    },
  ],
};

export const newOptInTriggerOutputSchema: OutputSchema = { fields: contactFieldsWithTags };

export const contactTagRemovedTriggerOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'tag',
      label: 'Tag',
      description: 'The tag that was just removed.',
      children: [
        { key: 'id', label: 'Tag ID' },
        { key: 'name', label: 'Name' },
      ],
    },
    {
      key: 'contact',
      label: 'Contact',
      description: 'The contact it was removed from, with its remaining tags.',
      children: contactFieldsWithTags,
    },
  ],
};

export const tagOutputFields = tagFields;
export const enrollmentOutputFields = enrollmentFields;
export const contactOutputFields = contactFieldsWithTags;
