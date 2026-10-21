import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { gotifyAuth } from '../auth';
import { gotifyClient } from '../common/client';
import { gotifyOutputSchemas } from '../common/output-schemas';

export const listMessages = createAction({
  auth: gotifyAuth,
  name: 'list_messages',
  classification: 'SEARCH',
  displayName: 'List Messages',
  description: 'List messages, newest first, optionally for one application.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists Gotify messages newest first (all applications, or one application when applicationId is given). Returns up to limit (1-200, default 100) messages plus hasMore and nextSince; pass nextSince back as since to get the next older page. Needs the Client Token. Read-only.',
    idempotent: true,
  },
  outputSchema: gotifyOutputSchemas.listMessages,
  props: {
    applicationId: Property.ShortText({
      displayName: 'Application ID',
      description: 'Only list messages of this application. Empty = all.',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of messages to return (1-200). Default 100.',
      required: false,
    }),
    since: Property.Number({
      displayName: 'Since',
      description: 'Only messages with a lower ID (nextSince of the previous page).',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const applicationText = gotifyClient.optionalText(propsValue.applicationId);
    const applicationId =
      applicationText === undefined ? undefined : gotifyClient.parseId({ value: applicationText, label: 'Application ID' });
    const limit = gotifyClient.parseOptionalInt({ value: propsValue.limit, label: 'Limit', min: 1, max: 200 }) ?? 100;
    const since = gotifyClient.parseOptionalInt({ value: propsValue.since, label: 'Since', min: 0, max: Number.MAX_SAFE_INTEGER });
    const body = await gotifyClient.request({
      auth: auth.props,
      method: HttpMethod.GET,
      path: applicationId === undefined ? '/message' : `/application/${applicationId}/message`,
      query: { limit, since },
      tokenKind: 'client',
    });
    const record = gotifyClient.isRecord(body) ? body : {};
    const paging = gotifyClient.isRecord(record['paging']) ? record['paging'] : {};
    const messages = gotifyClient.arrayOf(record['messages']);
    const next = paging['next'];
    const hasMore = typeof next === 'string' && next !== '';
    const pagingSince = paging['since'];
    return {
      messages,
      count: messages.length,
      hasMore,
      nextSince: hasMore && typeof pagingSince === 'number' ? pagingSince : null,
    };
  },
});
