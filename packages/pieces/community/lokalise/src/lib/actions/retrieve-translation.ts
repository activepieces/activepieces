import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { lokaliseAuth } from '../common/auth';
import { projectDropdown } from '../common/props';

export const retrieveTranslation = createAction({
  auth: lokaliseAuth,
  name: 'retrieveTranslation',
  displayName: 'Retrieve Translation',
  description: 'Retrieve a specific translation from your Lokalise project',
  audience: 'both',
  aiMetadata: { description: 'Fetch a single translation by its translation ID from a Lokalise project. Use to read the current value, status, and metadata of one translation. Read-only and idempotent.', idempotent: true },
  props: {
    projectId: projectDropdown,
    translationId: Property.ShortText({
      displayName: 'Translation ID',
      description: 'Unique translation identifier',
      required: true,
    }),
    disableReferences: Property.Checkbox({
      displayName: 'Disable References',
      description: 'Disable key references in the translation',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { projectId, translationId, disableReferences } = context.propsValue;

    const queryParams = new URLSearchParams();
    if (disableReferences) {
      queryParams.append('disable_references', '1');
    }

    const path = `/projects/${projectId}/translations/${translationId}${
      queryParams.toString() ? `?${queryParams.toString()}` : ''
    }`;

    const response = await makeRequest(
      context.auth.secret_text,
      HttpMethod.GET,
      path
    );

    return response;
  },
});
