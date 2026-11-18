import { createAction, Property } from '@activepieces/pieces-framework';
import type { RichLongRunningOperation } from '@microsoft/microsoft-graph-types';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharepointGetOperationOutputSchema } from '../../../output-schemas';

export const getSiteOperationAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_get_site_operation',
  outputSchema: microsoftSharepointGetOperationOutputSchema,
  displayName: 'Get Site Operation',
  description: 'Gets the status of a long-running operation on a SharePoint site.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Gets the current status, progress and error of one long-running operation on a SharePoint site. Reads it once and does not wait; List Site Operations returns the operation IDs.',
    idempotent: true,
  },
  props: {
    siteId: microsoftSharePointAiProps.siteId({ required: true }),
    operationId: Property.ShortText({
      displayName: 'Operation ID',
      description: 'ID of the operation. Use List Site Operations to find it.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const operation: RichLongRunningOperation = await microsoftSharePointClient
      .create({ auth })
      .api(
        `/sites/${encodeURIComponent(propsValue.siteId)}/operations/${encodeURIComponent(propsValue.operationId)}`
      )
      .get();
    return operation;
  },
});
