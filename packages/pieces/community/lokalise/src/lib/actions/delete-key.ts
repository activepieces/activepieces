import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { lokaliseAuth } from '../common/auth';
import { projectDropdown, keyIdProp } from '../common/props';

export const deleteKey = createAction({
  auth: lokaliseAuth,
  name: 'deleteKey',
  displayName: 'Delete Key',
  description:
    'Delete a key from your Lokalise project (software and marketing projects only)',
  audience: 'both',
  aiMetadata: { description: 'Permanently delete a translation key (and its translations) from a Lokalise project, identified by project ID and key ID. Only works for software and marketing project types. Idempotent in effect: once deleted, re-running has no further effect, though the key must currently exist.', idempotent: true },
  props: {
    projectId: projectDropdown,
    keyId: keyIdProp,
  },
  async run(context) {
    const { projectId, keyId } = context.propsValue;

    const path = `/projects/${projectId}/keys/${keyId}`;
    const response = await makeRequest(
      context.auth.secret_text,
      HttpMethod.DELETE,
      path
    );

    return response;
  },
});
