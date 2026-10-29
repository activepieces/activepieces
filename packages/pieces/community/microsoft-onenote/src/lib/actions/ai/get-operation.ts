import { createAction } from '@activepieces/pieces-framework';

import { microsoftOneNoteAuth } from '../../auth';
import { microsoftOneNoteAiProps } from '../../common/ai-props';
import { microsoftOneNoteClient } from '../../common/client';
import { microsoftOnenoteOperationOutputSchema } from '../../output-schemas';

import type { OnenoteOperation } from '../../common/types';

export const getOperationAction = createAction({
  auth: microsoftOneNoteAuth,
  name: 'microsoft_onenote_get_operation',
  outputSchema: microsoftOnenoteOperationOutputSchema,
  displayName: 'Get Operation',
  description: 'Gets the status of a OneNote copy operation.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Reads the status of a copy started by Copy Notebook, Copy Section to Notebook, Copy Section to Section Group or Copy Page to Section, once. Status is NotStarted, Running, Completed or Failed; when Completed, resourceLocation points to the new item.',
    idempotent: true,
  },
  props: {
    operationId: microsoftOneNoteAiProps.pageId({
      required: true,
      displayName: 'Operation ID',
      description: 'The operation ID a copy action returned.',
    }),
  },
  async run({ auth, propsValue }) {
    const response: OnenoteOperation = await microsoftOneNoteClient
      .create({ auth })
      .api(`/me/onenote/operations/${encodeURIComponent(propsValue.operationId)}`)
      .get();
    return response;
  },
});
