import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { pastDevAuth } from '../auth';
import { pastDevClient } from '../common/client';
import { pastDevProps } from '../common/props';

export const ingestAction = createAction({
  auth: pastDevAuth,
  name: 'ingest',
  classification: 'WRITE',
  displayName: 'Ingest',
  description:
    'Send one data point (a message, a note, a record) to past dev. past dev turns it into memory that Recall can find later.',
  audience: 'both',
  aiMetadata: {
    description:
      'Ingest one timestamped data point into past dev memory. Use it to save something worth remembering; use Recall to read memory. The workflow builder must set the identity, never the agent. Sending the same source id and content again changes nothing and costs nothing, so a retry is safe.',
    idempotent: true,
  },
  props: {
    content: Property.LongText({
      displayName: 'Content',
      description:
        'The text to remember, for example a chat message, an email body or a meeting note.',
      required: true,
    }),
    identity: pastDevProps.identityDropdown({
      required: false,
      description:
        'The person or account this data point is about, for example a user id from your app. Select one, type a new one, or map one from an earlier step. past dev creates the identity on its first ingest. Set this value yourself: never let an AI agent choose it.',
    }),
    timestamp: Property.DateTime({
      displayName: 'Occurred at',
      description:
        'When the content happened. Leave it empty to use the time of the request.',
      required: false,
    }),
    id: Property.ShortText({
      displayName: 'Source ID',
      description:
        'Your own stable id for this data point, for example the message id. Send the same id again to replace the data point, or use it later with Delete data point. If empty, past dev uses a hash of the content.',
      required: false,
    }),
    audience: pastDevProps.audienceDropdown,
    label: Property.ShortText({
      displayName: 'Label',
      description:
        'A short title for the data point. Recall returns it with the source.',
      required: false,
    }),
    metadata: Property.Json({
      displayName: 'Metadata',
      description:
        'Optional JSON stored with the source and returned by Recall exactly as sent.',
      required: false,
    }),
    idempotencyKey: Property.ShortText({
      displayName: 'Idempotency key',
      description:
        'Optional replay key. A second request with the same key returns the first result.',
      required: false,
    }),
  },
  async run(context) {
    const { content, identity, timestamp, id, audience, label, metadata, idempotencyKey } =
      context.propsValue;
    const response = await pastDevClient.sendRequest<IngestResult>({
      connection: {
        apiKey: context.auth.props.apiKey,
        apiHost: context.auth.props.apiHost,
      },
      method: HttpMethod.POST,
      path: '/api/v1/ingest',
      body: pastDevClient.withoutEmpty({
        content,
        identity,
        timestamp,
        id,
        audience,
        label,
        metadata,
        idempotencyKey,
      }),
      redactBodyInErrors: true,
    });
    return {
      ...response.body,
      requestId: response.requestId,
    };
  },
});

type IngestResult = {
  projectId: number;
  ingestionId: string;
  sourceId: string;
  status: 'queued' | 'completed';
  unchanged?: boolean | null;
};
