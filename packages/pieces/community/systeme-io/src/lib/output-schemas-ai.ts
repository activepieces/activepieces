import { OutputSchema, OutputSchemaField } from '@activepieces/pieces-framework';
import { contactOutputFields, enrollmentOutputFields, tagOutputFields } from './output-schemas';

const listMeta: OutputSchemaField[] = [
  { key: 'count', label: 'Returned', format: 'number' },
  { key: 'has_more', label: 'More Available', format: 'boolean' },
  {
    key: 'next_cursor',
    label: 'Next Cursor',
    description: 'Pass as starting_after to continue. Empty when there are no more rows.',
  },
];

const contactField: OutputSchemaField = {
  key: 'contact',
  label: 'Contact',
  children: contactOutputFields,
};

export const aiListTagsOutputSchema: OutputSchema = {
  fields: [{ key: 'tags', label: 'Tags', labelKey: 'name', listItems: tagOutputFields }, ...listMeta],
};

export const aiTagOutputSchema: OutputSchema = { fields: tagOutputFields };

export const aiListContactFieldsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'fields',
      label: 'Contact Fields',
      labelKey: 'field_name',
      listItems: [
        { key: 'slug', label: 'Slug', description: 'Use this as the slug in create and update calls.' },
        { key: 'field_name', label: 'Field Name' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
    {
      key: 'has_more',
      label: 'More Available',
      format: 'boolean',
      description: 'Systeme.io returns every contact field in one response and has no paging for this list, so this is false unless that response was cut off.',
    },
  ],
};

export const aiListCoursesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'courses',
      label: 'Courses',
      labelKey: 'name',
      listItems: [
        { key: 'id', label: 'Course ID' },
        { key: 'name', label: 'Name' },
        { key: 'active', label: 'Active', format: 'boolean' },
        { key: 'description', label: 'Description' },
        { key: 'path', label: 'Path' },
        { key: 'domain_name', label: 'Domain' },
        { key: 'locale', label: 'Locale' },
        {
          key: 'modules',
          label: 'Modules',
          labelKey: 'name',
          listItems: [
            { key: 'id', label: 'Module ID' },
            { key: 'name', label: 'Name' },
          ],
        },
      ],
    },
    ...listMeta,
  ],
};

export const aiListEnrollmentsOutputSchema: OutputSchema = {
  fields: [
    { key: 'enrollments', label: 'Enrollments', labelKey: 'course_name', listItems: enrollmentOutputFields },
    ...listMeta,
  ],
};

export const aiListCommunitiesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'communities',
      label: 'Communities',
      labelKey: 'name',
      listItems: [
        { key: 'id', label: 'Community ID' },
        { key: 'name', label: 'Name' },
        { key: 'path', label: 'Path' },
        { key: 'domain_name', label: 'Domain' },
      ],
    },
    ...listMeta,
  ],
};

export const aiListMembershipsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'memberships',
      label: 'Memberships',
      labelKey: 'community_name',
      listItems: [
        { key: 'id', label: 'Membership ID' },
        { key: 'community_id', label: 'Community ID' },
        { key: 'community_name', label: 'Community Name' },
        { key: 'contact_id', label: 'Contact ID' },
      ],
    },
    ...listMeta,
  ],
};

export const aiListSubscriptionsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'subscriptions',
      label: 'Subscriptions',
      labelKey: 'price_plan_name',
      listItems: [
        { key: 'id', label: 'Subscription ID' },
        { key: 'status', label: 'Status' },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
        { key: 'cancelled_at', label: 'Cancelled At', format: 'datetime' },
        { key: 'completed_at', label: 'Completed At', format: 'datetime' },
        { key: 'price_plan_id', label: 'Price Plan ID' },
        { key: 'price_plan_name', label: 'Price Plan' },
        { key: 'price_plan_type', label: 'Price Plan Type' },
        {
          key: 'amount',
          label: 'Amount',
          format: 'number',
          description: 'Unverified: most likely in the smallest currency unit (cents).',
        },
        { key: 'currency', label: 'Currency' },
        { key: 'interval', label: 'Billing Interval' },
        { key: 'interval_count', label: 'Interval Count', format: 'number' },
      ],
    },
    ...listMeta,
  ],
};

export const aiCreateContactOutputSchema: OutputSchema = {
  fields: [
    { key: 'contact_id', label: 'Contact ID' },
    { key: 'email', label: 'Email', format: 'email' },
    { key: 'tags_assigned', label: 'Tags Assigned', format: 'number' },
    { key: 'tags_failed', label: 'Tags Failed', format: 'number' },
    {
      key: 'tag_results',
      label: 'Tag Results',
      labelKey: 'tag_id',
      listItems: [
        { key: 'tag_id', label: 'Tag ID' },
        { key: 'assigned', label: 'Assigned', format: 'boolean' },
        { key: 'error', label: 'Error' },
      ],
    },
    {
      ...contactField,
      description: 'The contact after its tags were assigned. If that re-read fails, the contact as created, without the new tags.',
    },
  ],
};

export const aiUpdateContactOutputSchema: OutputSchema = {
  fields: [
    { key: 'contact_id', label: 'Contact ID' },
    { key: 'updated_slugs', label: 'Updated Fields' },
    { key: 'cleared_slugs', label: 'Cleared Fields' },
    { key: 'locale_changed', label: 'Locale Changed', format: 'boolean' },
    { ...contactField, description: 'The contact after the update.' },
  ],
};

export const aiAddTagOutputSchema: OutputSchema = {
  fields: [
    { key: 'assigned', label: 'Assigned', format: 'boolean' },
    {
      key: 'already_assigned',
      label: 'Already Had Tag',
      format: 'boolean',
      description:
        'True only when Systeme.io rejected the call and the tag was confirmed on the contact. A normal repeat succeeds with this false.',
    },
    { key: 'contact_id', label: 'Contact ID' },
    { key: 'tag_id', label: 'Tag ID' },
  ],
};
