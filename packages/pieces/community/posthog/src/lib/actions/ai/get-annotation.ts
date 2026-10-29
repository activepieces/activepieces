import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { posthogAuth } from '../../auth';
import { posthogClient } from '../../common/client';
import { posthogMappers } from '../../common/mappers';
import { posthogOutputSchemas } from '../../common/output-schemas';

const getAnnotation = createAction({
  auth: posthogAuth,
  name: 'get_annotation',
  classification: 'READ',
  displayName: 'Get Annotation',
  description: 'Get one annotation by its numeric ID.',
  audience: 'ai',
  aiMetadata: {
    description: 'Returns one PostHog annotation by numeric annotation id (from Create Annotation): content, dateMarker, scope and createdAt. Read-only.',
    idempotent: true,
  },
  outputSchema: posthogOutputSchemas.annotation,
  props: {
    annotationId: Property.ShortText({ displayName: 'Annotation ID', required: true }),
  },
  async run({ auth, propsValue }) {
    const annotationId = posthogClient.numericId({ value: propsValue.annotationId, label: 'Annotation ID' });
    const body = await posthogClient.request({
      auth: auth.props,
      method: HttpMethod.GET,
      path: posthogClient.projectPath({ auth: auth.props, segments: ['annotations', annotationId] }),
    });
    return posthogMappers.annotation(body);
  },
});

export { getAnnotation };
