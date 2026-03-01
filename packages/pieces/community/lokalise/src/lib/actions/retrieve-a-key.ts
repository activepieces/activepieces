import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { lokaliseAuth } from '../common/auth';
import { projectDropdown, keyIdProp } from '../common/props';

export const retrieveAKey = createAction({
  auth: lokaliseAuth,
  name: 'retrieveAKey',
  displayName: 'Retrieve a key',
  description: 'Retrieve detailed information about a specific key in your Lokalise project',
  props: {
    projectId: projectDropdown,
    keyId: keyIdProp,
    disableReferences: Property.Checkbox({
      displayName: 'Disable References',
      description: 'Disable key references in the response',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { projectId, keyId, disableReferences } = context.propsValue;

    const queryParams = new URLSearchParams();
    if (disableReferences) {
      queryParams.append('disable_references', '1');
    }

    const path = `/projects/${projectId}/keys/${keyId}${
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
