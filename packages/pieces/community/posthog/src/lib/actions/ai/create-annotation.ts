import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { posthogAuth } from '../../auth';
import { posthogClient } from '../../common/client';
import { posthogMappers } from '../../common/mappers';
import { posthogOutputSchemas } from '../../common/output-schemas';

export const createAnnotation = createAction({
  auth: posthogAuth,
  name: 'create_annotation',
  classification: 'WRITE',
  displayName: 'Create Annotation',
  description: 'Add an annotation (e.g. a release note) to PostHog charts.',
  audience: 'ai',
  aiMetadata: {
    description: 'Adds an annotation to the PostHog project, shown as a marker on every chart at dateMarker (ISO 8601, default now), e.g. "Deployed v2.3" or "Marketing campaign started". scope project (default) shows it on all charts in the project, organization on all projects. Each call adds another annotation. Returns the annotation id.',
    idempotent: false,
  },
  outputSchema: posthogOutputSchemas.annotation,
  props: {
    content: Property.LongText({ displayName: 'Content', required: true }),
    dateMarker: Property.DateTime({ displayName: 'Date', required: false }),
    scope: Property.StaticDropdown({
      displayName: 'Scope',
      required: false,
      defaultValue: 'project',
      options: { options: [{ label: 'Project', value: 'project' }, { label: 'Organization', value: 'organization' }] },
    }),
  },
  async run({ auth, propsValue }) {
    const content = posthogClient.requiredText({ value: propsValue.content, label: 'Content' });
    const scope = posthogClient.optionalText(propsValue.scope) ?? 'project';
    if (scope !== 'project' && scope !== 'organization') throw new Error('Scope must be project or organization.');
    const dateMarker = posthogClient.isoTimestamp({ value: propsValue.dateMarker, label: 'Date' }) ?? new Date().toISOString();
    const body = await posthogClient.request({
      auth: auth.props,
      method: HttpMethod.POST,
      path: posthogClient.projectPath({ auth: auth.props, segments: ['annotations'] }),
      body: { content, date_marker: dateMarker, scope },
    });
    return posthogMappers.annotation(body);
  },
});
