import { createAction } from '@activepieces/pieces-framework';
import type { ExtractSensitivityLabelsResult } from '@microsoft/microsoft-graph-types';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharepointExtractSensitivityLabelsOutputSchema } from '../../../output-schemas';

export const extractSensitivityLabelsAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_extract_sensitivity_labels',
  outputSchema: microsoftSharepointExtractSensitivityLabelsOutputSchema,
  displayName: 'Extract Sensitivity Labels',
  description: 'Gets the sensitivity labels assigned to a file.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Gets the Purview sensitivity labels on a file, re-reading them from the file content when the stored ones are stale, with each label ID and how it was assigned. Use it to check the result of Assign Sensitivity Label. Supported file types only; List Folder Children, Find File or Search return the item ID.',
    idempotent: true,
  },
  props: {
    driveId: microsoftSharePointAiProps.driveId({ required: true }),
    itemId: microsoftSharePointAiProps.itemId({ required: true }),
  },
  async run({ auth, propsValue }) {
    const result: ExtractSensitivityLabelsResult = await microsoftSharePointClient
      .create({ auth })
      .api(`/drives/${encodeURIComponent(propsValue.driveId)}/items/${encodeURIComponent(propsValue.itemId)}/extractSensitivityLabels`)
      .post(undefined);
    return result;
  },
});
