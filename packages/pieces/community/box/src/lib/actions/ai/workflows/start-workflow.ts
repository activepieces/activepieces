import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const startWorkflowAction = createAction({
  auth: boxAuth,
  name: 'box_start_workflow',
  displayName: 'Start Workflow',
  description: 'Starts a manual-start Box Relay workflow on files.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Starts a Box Relay workflow\'s manual-start flow for files in the workflow\'s folder; each call starts a new run. Needs Box Relay. Get the workflow ID, flow ID and outcome IDs from List Workflows (for the same folder).',
    idempotent: false,
  },
  props: {
    workflowId: Property.ShortText({
      displayName: 'Workflow ID',
      description: 'The workflow ID, from List Workflows.',
      required: true,
    }),
    flowId: Property.ShortText({
      displayName: 'Flow ID',
      description: 'ID of the workflow\'s manual-start flow, from flows[].id in List Workflows.',
      required: true,
    }),
    folderId: boxAiProps.folderId({
      required: true,
      description: 'ID of the folder the workflow is configured on (the folder given to List Workflows).',
    }),
    fileIds: Property.Array({
      displayName: 'File IDs',
      description: 'IDs of the files to start the workflow for. All must be in the workflow\'s folder.',
      required: true,
    }),
    outcomes: Property.Json({
      displayName: 'Outcomes',
      description: 'Configurable outcome values, e.g. [{"id": "<outcome id>", "collaborators": {"type": "variable", "variable_type": "user_list", "variable_value": [{"type": "user", "id": "123"}]}}].',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const fileIds = propsValue.fileIds.map(String);
    if (fileIds.length === 0) {
      throw new Error('File IDs must hold at least one ID.');
    }
    await boxClient.request<unknown>({
      auth,
      method: HttpMethod.POST,
      path: `/workflows/${encodeURIComponent(propsValue.workflowId)}/start`,
      body: {
        type: 'workflow_parameters',
        flow: { type: 'flow', id: propsValue.flowId },
        files: fileIds.map((id) => ({ type: 'file', id })),
        folder: { type: 'folder', id: propsValue.folderId },
        ...(propsValue.outcomes !== undefined ? { outcomes: propsValue.outcomes } : {}),
      },
    });
    return { started: true, workflowId: propsValue.workflowId, flowId: propsValue.flowId, fileIds };
  },
});
