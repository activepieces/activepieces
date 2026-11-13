import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { posthogAuth } from '../../auth';
import { posthogClient } from '../../common/client';
import { posthogMappers } from '../../common/mappers';
import { posthogOutputSchemas } from '../../common/output-schemas';

const updateAnnotation = createAction({
  auth: posthogAuth,
  name: 'update_annotation',
  classification: 'WRITE',
  displayName: 'Update Annotation',
  description: 'Change the content, date or scope of an annotation.',
  audience: 'ai',
  aiMetadata: {
    description: 'Updates one PostHog annotation by numeric annotation id. Only the fields you pass change: content (text), dateMarker (ISO 8601), scope (project or organization). Pass at least one. Returns the updated annotation.',
    idempotent: true,
  },
  outputSchema: posthogOutputSchemas.annotation,
  props: {
    annotationId: Property.ShortText({ displayName: 'Annotation ID', required: true }),
    content: Property.LongText({ displayName: 'Content', required: false }),
    dateMarker: Property.DateTime({ displayName: 'Date', required: false }),
    scope: Property.StaticDropdown({
      displayName: 'Scope',
      required: false,
      options: { options: [{ label: 'Project', value: 'project' }, { label: 'Organization', value: 'organization' }] },
    }),
  },
  async run({ auth, propsValue }) {
    const annotationId = posthogClient.numericId({ value: propsValue.annotationId, label: 'Annotation ID' });
    const content = posthogClient.optionalText(propsValue.content);
    const dateMarker = posthogClient.isoTimestamp({ value: propsValue.dateMarker, label: 'Date' });
    const scope = posthogClient.optionalText(propsValue.scope);
    if (scope !== undefined && scope !== 'project' && scope !== 'organization') throw new Error('Scope must be project or organization.');
    const changes = { content, date_marker: dateMarker, scope };
    const body = Object.fromEntries(Object.entries(changes).filter(([, v]) => v !== undefined));
    if (Object.keys(body).length === 0) throw new Error('Pass at least one of Content, Date or Scope to update.');
    const result = await posthogClient.request({
      auth: auth.props,
      method: HttpMethod.PATCH,
      path: posthogClient.projectPath({ auth: auth.props, segments: ['annotations', annotationId] }),
      body,
    });
    return posthogMappers.annotation(result);
  },
});

export { updateAnnotation };
