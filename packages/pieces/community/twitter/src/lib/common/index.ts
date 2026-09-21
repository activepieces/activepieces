import { Property } from '@activepieces/pieces-framework';

function describeStatus({
  code,
  notFoundHint,
}: {
  code?: number;
  notFoundHint: string;
}): string | undefined {
  if (code === 401) {
    return 'X API 401: the stored credentials were rejected. Reconnect the X connection.';
  }
  if (code === 403) {
    return 'X API 403: the X app permission level does not allow this operation, or the target resource does not belong to the authenticated account.';
  }
  if (code === 404) {
    return `X API 404: ${notFoundHint}`;
  }
  if (code === 429) {
    return 'X API 429: rate limit reached. Wait for the limit window to reset before retrying.';
  }
  return undefined;
}

function buildError({
  error,
  notFoundHint,
}: {
  error: TwitterErrorLike;
  notFoundHint: string;
}): Error {
  const described = describeStatus({ code: error?.code, notFoundHint });
  if (described === undefined && error?.errors === undefined) {
    const cause =
      typeof error?.message === 'string' && error.message.length > 0
        ? error.message
        : String(error);
    return new Error(`X API request failed: ${cause}`);
  }
  return new Error(
    `${described ?? 'X API request failed.'} ${JSON.stringify({
      code: error?.code,
      errors: error?.errors,
    })}`
  );
}

export const twitterCommon = {
    text: Property.LongText({
        displayName: 'Text',
        description: 'The text of the tweet',
        required: true,
      }),
      image_1: Property.File({
        displayName: 'Media (1)',
        description:
          'An image, video or GIF url or base64 to attach to the tweet',
        required: false,
      }),
      image_2: Property.File({
        displayName: 'Media (2)',
        description:
          'An image, video or GIF url or base64 to attach to the tweet',
        required: false,
      }),
      image_3: Property.File({
        displayName: 'Media (3)',
        description:
          'An image, video or GIF url or base64 to attach to the tweet',
        required: false,
      }),
    };

export const twitterHelpers = {
  buildError,
};

export const twitterFieldSets = {
  user: 'created_at,description,public_metrics,verified,profile_image_url',
};

export type TwitterErrorLike = {
  code?: number;
  errors?: unknown;
  message?: string;
};
