import { Property } from '@activepieces/pieces-framework';

function postId<R extends boolean>({
  required,
  displayName = 'Post ID',
  description = 'Numeric ID of the Beamer post, e.g. "233259480". Use List Posts to find it.',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function limit<R extends boolean>({
  required,
  displayName = 'Limit',
  description = 'How many items to return on this page, 1-10 (Beamer returns at most 10). Defaults to 10.',
}: PropParams<R>) {
  return Property.Number({ displayName, description, required });
}

function page<R extends boolean>({
  required,
  displayName = 'Page',
  description = 'Page number, starting at 0 (Beamer counts pages from 0), combined with Limit to page through results. Defaults to 0, the first page.',
}: PropParams<R>) {
  return Property.Number({ displayName, description, required });
}

function dateFrom<R extends boolean>({
  required,
  displayName = 'Date From',
  description = 'Only include items published after this date, in ISO-8601 format, e.g. "2026-01-31T00:00:00Z".',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function dateTo<R extends boolean>({
  required,
  displayName = 'Date To',
  description = 'Only include items published before this date, in ISO-8601 format. Defaults to now.',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function category<R extends boolean>({
  required,
  displayName = 'Category',
  description = 'Post category.',
}: PropParams<R>) {
  return Property.StaticDropdown({
    displayName,
    description,
    required,
    options: { options: CATEGORY_OPTIONS },
  });
}

function booleanChoice<R extends boolean>({ required, displayName = '', description }: PropParams<R>) {
  return Property.StaticDropdown({
    displayName,
    description,
    required,
    options: {
      options: [
        { label: 'Yes', value: 'true' },
        { label: 'No', value: 'false' },
      ],
    },
  });
}

function viewerUserId<R extends boolean>({
  required,
  displayName = 'User ID',
  description = 'Your app\'s ID for the end user (the user_id set in the Beamer embed script).',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function viewerUserEmail<R extends boolean>({
  required,
  displayName = 'User Email',
  description = 'Email of the end user.',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function viewerFirstName<R extends boolean>({
  required,
  displayName = 'User First Name',
  description = 'First name of the end user.',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function viewerLastName<R extends boolean>({
  required,
  displayName = 'User Last Name',
  description = 'Last name of the end user.',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

export const beamerAiProps = {
  postId,
  limit,
  page,
  dateFrom,
  dateTo,
  category,
  booleanChoice,
  viewerUserId,
  viewerUserEmail,
  viewerFirstName,
  viewerLastName,
};

const CATEGORY_OPTIONS = [
  { label: 'New', value: 'new' },
  { label: 'Improvement', value: 'improvement' },
  { label: 'Fix', value: 'fix' },
  { label: 'Coming Soon', value: 'coming_soon' },
  { label: 'Announcement', value: 'announcement' },
];

export type PropParams<R extends boolean> = { required: R; displayName?: string; description?: string };
