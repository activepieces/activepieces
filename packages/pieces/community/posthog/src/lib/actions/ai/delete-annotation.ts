import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { posthogAuth } from '../../auth';
import { posthogClient } from '../../common/client';
import { posthogOutputSchemas } from '../../common/output-schemas';

export const deleteAnnotation = createAction({
  auth: posthogAuth,
  name: 'delete_annotation',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Annotation',
  description: 'Delete an annotation by its numeric ID.',
  audience: 'ai',
  aiMetadata: {
    description: 'Deletes a PostHog annotation by numeric annotation id (from Create Annotation). It disappears from all charts. Repeating it on an already-deleted annotation returns not found.',
    idempotent: false,
  },
  outputSchema: posthogOutputSchemas.deleted,
  props: {
    annotationId: Property.ShortText({ displayName: 'Annotation ID', required: true }),
  },
  async run({ auth, propsValue }) {
    const annotationId = posthogClient.numericId({ value: propsValue.annotationId, label: 'Annotation ID' });
    await posthogClient.request({
      auth: auth.props,
      method: HttpMethod.PATCH,
      path: posthogClient.projectPath({ auth: auth.props, segments: ['annotations', annotationId] }),
      body: { deleted: true },
    });
    return { id: annotationId, deleted: true };
  },
});
