import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: DELETE /public-api/resources/configuration-templates/v1.0/{template}/variables/{variable}

export const configurationTemplateVariableDeleteAction = createAction({
  auth: ampecoAuth,
  name: 'configurationTemplateVariableDelete',
  displayName: 'Resources - Configuration Templates - Configuration Template Variable Delete',
  description: 'Delete a Configuration Template Variable.',
  audience: 'both',
  aiMetadata: { description: 'Permanently delete a single configuration variable from an OCPP configuration template, identified by template id and variable id. Destructive and not idempotent: deleting an already-removed variable will fail. Use the variable Listing action first to confirm the variable id.', idempotent: false },
  props: {
        
  template: Property.Number({
    displayName: 'Template',
    required: true,
  }),

  variable: Property.Number({
    displayName: 'Variable',
    required: true,
  }),
  },
  async run(context): Promise<unknown> {
    try {
      const url = processPathParameters('/public-api/resources/configuration-templates/v1.0/{template}/variables/{variable}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.DELETE,
        body,
        queryParams
      ) as unknown;

    } catch (error) {
      handleApiError(error);
    }
  },
});
