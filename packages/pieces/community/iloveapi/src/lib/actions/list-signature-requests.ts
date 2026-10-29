import { Property, createAction } from '@activepieces/pieces-framework';
import { iloveapiAuth } from '../common/auth';
import { iLoveApi } from '../common/client';
import { iloveSchemas } from '../common/schemas';

export const listSignatureRequestsAction = createAction({
  auth: iloveapiAuth,
  name: 'list_signature_requests',
  classification: 'SEARCH',
  displayName: 'List Signature Requests',
  description: 'List the signature requests of this project, one page at a time.',
  audience: 'both',
  outputSchema: iloveSchemas.signatureList,
  aiMetadata: {
    description:
      'List the project\'s signature requests one page at a time (newest first), returning each request\'s requester token, status and signers. Use the returned requester token with Get Signature Status, reminders, void or downloads. When "has_more" is true, call again with "next_page". Read-only.',
    idempotent: true,
  },
  props: {
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number, starting at 1.',
      required: false,
      defaultValue: 1,
    }),
    per_page: Property.Number({
      displayName: 'Per Page',
      description: '1 to 100. Default 20.',
      required: false,
      defaultValue: 20,
    }),
  },
  async run(context) {
    const page = Number(context.propsValue.page ?? 1);
    const perPage = Number(context.propsValue.per_page ?? 20);
    if (!Number.isInteger(page) || page < 1) {
      throw new Error('Page must be a whole number, 1 or more.');
    }
    if (!Number.isInteger(perPage) || perPage < 1 || perPage > 100) {
      throw new Error('Per Page must be a whole number between 1 and 100.');
    }

    const token = await iLoveApi.authenticate({ publicKey: context.auth.secret_text });
    const response = await iLoveApi.listSignatures({ token, page, perPage });
    const list = Array.isArray(response)
      ? response
      : iLoveApi.isRecord(response) && Array.isArray(response['items'])
        ? response['items']
        : null;
    if (list === null) {
      throw new Error('iLoveAPI returned an unexpected signature list.');
    }
    const items = list.filter((item): item is Record<string, unknown> => iLoveApi.isRecord(item));
    const hasMore = items.length === perPage;
    return {
      items,
      count: items.length,
      page,
      per_page: perPage,
      next_page: hasMore ? page + 1 : null,
      has_more: hasMore,
    };
  },
});
