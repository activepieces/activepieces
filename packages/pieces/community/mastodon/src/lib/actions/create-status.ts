import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mastodonAuth } from '../..';
import {
  MastodonEntity,
  mastodonClient,
  mastodonProps,
  mastodonUtils,
} from '../common/client';
import { statusOutputSchema } from '../output-schemas';

export const createStatus = createAction({
  auth: mastodonAuth,
  name: 'create_status',
  classification: 'WRITE',
  displayName: 'Create Status',
  description: 'Publish a status (toot), reply, or poll from the connected account.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Publishes a new status from the connected account, with control over visibility, content warning, language, attached media (IDs from Upload Media) or a poll; replies are this action with In Reply To set. Use Schedule Status instead to publish later. Media and a poll cannot be combined. Each call creates a new post; an optional Idempotency Key makes Mastodon ignore a duplicate submitted within about an hour, but retries after that duplicate the post.',
    idempotent: false,
  },
  outputSchema: statusOutputSchema,
  props: {
    ...mastodonProps.compose(),
    idempotency_key: Property.ShortText({
      displayName: 'Idempotency Key',
      description:
        'Optional unique string (for example a UUID). Mastodon keeps it for up to 1 hour and returns the original post instead of creating a duplicate when the same key is sent again.',
      required: false,
    }),
  },
  async run(context) {
    const props = context.propsValue;
    const body = mastodonUtils.buildComposeBody({
      status: props.status,
      visibility: props.visibility,
      inReplyToId: props.in_reply_to_id,
      spoilerText: props.spoiler_text,
      sensitive: props.sensitive,
      language: props.language,
      mediaIds: mastodonUtils.toStringArray(props.media_ids),
      pollOptions: mastodonUtils.toStringArray(props.poll_options),
      pollExpiresIn: props.poll_expires_in,
      pollMultiple: props.poll_multiple,
    });
    const idempotencyKey = props.idempotency_key;
    return mastodonClient.request<MastodonEntity>({
      auth: context.auth.props,
      method: HttpMethod.POST,
      path: '/api/v1/statuses',
      operation: 'Create Status',
      scope: 'write:statuses',
      body,
      headers: mastodonUtils.hasValue(idempotencyKey)
        ? { 'Idempotency-Key': String(idempotencyKey) }
        : undefined,
    });
  },
});
