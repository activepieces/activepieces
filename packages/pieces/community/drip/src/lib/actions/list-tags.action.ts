import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { dripAuth } from '../auth';
import { dripApi } from '../common/client';
import { dripProps } from '../common/props';
import { dripOutputSchemas } from '../output-schemas';

export const listTagsAction = createAction({
  auth: dripAuth,
  name: 'list_tags',
  displayName: 'List Tags',
  description: 'Lists every tag used in the Drip account.',
  classification: 'SEARCH',
  audience: 'both',
  aiMetadata: {
    description: 'Lists every tag name used in a Drip account. Use to check the exact spelling of a tag before tagging, filtering or removing it. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    accountId: dripProps.accountId(),
  },
  outputSchema: dripOutputSchemas.stringList,
  async run({ auth, propsValue }) {
    const token = auth.secret_text;
    const accountId = await dripApi.resolveAccountId({ token, accountId: propsValue.accountId });
    const body = await dripApi.request<{ tags?: unknown }>({ token, method: HttpMethod.GET, path: `${dripApi.accountPath(accountId)}/tags`, operation: 'list tags' });
    return { items: Array.isArray(body.tags) ? body.tags.map(String) : [] };
  },
});
