import { Property } from '@activepieces/pieces-framework';

function userId<R extends boolean>({
  required,
  displayName = 'User ID',
  description = 'User ID (26 characters), or "me" for the connected account. Use Get User By Username or Search Users to find it.',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function teamId<R extends boolean>({
  required,
  displayName = 'Team ID',
  description = 'Team ID (26 characters). Use List Teams or Get Team By Name to find it.',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function channelId<R extends boolean>({
  required,
  displayName = 'Channel ID',
  description = 'Channel ID (26 characters). Use Get Channel By Name, Search Channels or List User Channels to find it.',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function postId<R extends boolean>({
  required,
  displayName = 'Post ID',
  description = 'Post ID (26 characters). Use List Channel Posts, Search Posts or Create Post to find it.',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function page<R extends boolean>({
  required,
  displayName = 'Page',
  description = 'Zero-based page number. Defaults to 0.',
}: PropParams<R>) {
  return Property.Number({ displayName, description, required });
}

function perPage<R extends boolean>({
  required,
  displayName = 'Per Page',
  description = 'Items per page, 1 to 200. Defaults to 60.',
}: PropParams<R>) {
  return Property.Number({ displayName, description, required });
}

function booleanFlag<R extends boolean>({
  required,
  displayName,
  description,
}: PropParams<R> & { displayName: string }) {
  return Property.StaticDropdown({
    displayName,
    description,
    required,
    options: {
      disabled: false,
      options: [
        { label: 'True', value: 'true' },
        { label: 'False', value: 'false' },
      ],
    },
  });
}

export const mattermostAiProps = {
  userId,
  teamId,
  channelId,
  postId,
  page,
  perPage,
  booleanFlag,
};

export type PropParams<R extends boolean> = {
  required: R;
  displayName?: string;
  description?: string;
};
