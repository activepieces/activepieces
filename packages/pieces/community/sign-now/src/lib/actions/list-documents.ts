import { createAction, Property } from '@activepieces/pieces-framework';
import { signNowAuth, getSignNowBearerToken } from '../common/auth';
import { SignNowApiError, signNowClient, signNowData } from '../common/client';
import { signNowSchemas } from '../common/schemas';

export const listDocumentsAction = createAction({
  auth: signNowAuth,
  name: 'list_documents',
  displayName: 'List Documents',
  description: 'Lists documents in your SignNow account.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists documents owned by the connected SignNow account, newest first, with ID, name, timestamps, role names and each invite status. Use it to find a document ID by name before Get Document, Send Free Form Invite, Invite to Sign or Delete Document. Templates are excluded. If truncated is true, narrow the name filter or raise the limit.',
    idempotent: true,
  },
  outputSchema: signNowSchemas.documentList,
  props: {
    name_contains: Property.ShortText({
      displayName: 'Name Contains',
      description: 'Only return documents whose name contains this text.',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of documents to return, from 1 to 500.',
      required: false,
      defaultValue: 50,
    }),
  },
  async run(context) {
    const { name_contains, limit } = context.propsValue;
    const max = limit ?? 50;
    if (!Number.isInteger(max) || max < 1 || max > MAX_LIMIT) {
      throw new Error('Limit must be a whole number from 1 to 500.');
    }
    const body = await signNowClient
      .request({
        token: getSignNowBearerToken(context.auth),
        method: 'GET',
        path: '/user/documentsv2',
        operation: 'list documents',
      })
      .catch((error: unknown) => {
        if (isNoDocumentsError(error)) {
          return [];
        }
        throw error;
      });
    const needle = name_contains?.trim().toLowerCase() ?? '';
    const all = (Array.isArray(body) ? body.filter(signNowData.isRecord) : [])
      .filter((document) => document['template'] !== true)
      .filter((document) => needle === '' || (signNowData.textAt({ value: document, key: 'document_name' }) ?? '').toLowerCase().includes(needle))
      .map((document) => ({
        id: signNowData.textAt({ value: document, key: 'id' }) ?? null,
        document_name: signNowData.textAt({ value: document, key: 'document_name' }) ?? null,
        created: signNowData.numberAt({ value: document, key: 'created' }) ?? null,
        updated: signNowData.numberAt({ value: document, key: 'updated' }) ?? null,
        page_count: signNowData.numberAt({ value: document, key: 'page_count' }) ?? null,
        roles: signNowData.roleNamesOf(document),
        invites: signNowData.invitesOf(document),
      }))
      .sort((a, b) => (b.updated ?? 0) - (a.updated ?? 0));
    const documents = all.slice(0, max);
    return { count: documents.length, total: all.length, truncated: all.length > documents.length, documents };
  },
});

function isNoDocumentsError(error: unknown): boolean {
  if (!(error instanceof SignNowApiError) || error.status !== 400) {
    return false;
  }
  const text = JSON.stringify(error.responseBody ?? '');
  return text.includes('could not get document ids') || /\b65536\b/.test(text);
}

const MAX_LIMIT = 500;
