import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';
import { boxUtils } from '../../../common/utils';
import { boxListWorkflowsOutputSchema } from '../../../output-schemas';

export const listWorkflowsAction = createAction({
  auth: boxAuth,
  name: 'box_list_workflows',
  outputSchema: boxListWorkflowsOutputSchema,
  displayName: 'List Workflows',
  description: 'Lists the Box Relay workflows on a folder that can be started manually.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists one page of the Box Relay workflows that act on a folder and have a manual-start flow, with workflow IDs and their flows and outcomes. Needs Box Relay. Page with Marker (next_marker). Use the workflow ID, flow ID and outcome IDs in Start Workflow.',
    idempotent: true,
  },
  props: {
    folderId: boxAiProps.folderId({
      required: true,
      description: 'ID of the folder the workflows act on. Get it from List Folder Items, Search or Create Folder.',
    }),
    triggerType: Property.ShortText({
      displayName: 'Trigger Type',
      description: 'Trigger type to filter by, e.g. "WORKFLOW_MANUAL_START".',
      required: false,
    }),
    limit: boxAiProps.limit({ required: false }),
    marker: boxAiProps.marker({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.GET,
      path: '/workflows',
      query: {
        folder_id: propsValue.folderId,
        trigger_type: propsValue.triggerType,
        marker: propsValue.marker,
        limit: boxUtils.limitParam({ limit: propsValue.limit, max: 1000, fallback: 100 }),
      },
    });
  },
});
