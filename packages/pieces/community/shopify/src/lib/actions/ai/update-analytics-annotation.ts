import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import { shopifyGraphqlClient, shopifyProps, shopifyValues } from '../../common/graphql';
import {
  analyticsFields,
  analyticsMappers,
  analyticsValues,
  GqlAnalyticsAnnotation,
} from '../../common/analytics';
import { analyticsAnnotationOutputSchema } from '../../output-schemas/analytics';

export const shopifyAiUpdateAnalyticsAnnotation = createAction({
  auth: shopifyAuth,
  name: 'update_analytics_annotation',
  classification: 'WRITE',
  displayName: 'Update Analytics Annotation',
  description: 'Change the type, title, description or dates of an analytics annotation this app created.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Changes one analytics annotation and returns it; every field you leave empty keeps its value. Pass the id returned by create_analytics_annotation (there is no action to list annotations). Only annotations this app created can be changed; any other id, or one already deleted, fails with NOT_FOUND. type must be one of the types apps may set; title at most 75 characters, description at most 150 (clear_description removes it). started_at/ended_at are ISO 8601 date-times with a time zone; make_open_ended removes the end so the event shows as still running (use ended_at to close it again). Repeating the same update leaves the same state. Needs the write_analytics_annotations access scope.',
    idempotent: true,
  },
  props: {
    annotation_id: Property.ShortText({
      displayName: 'Analytics Annotation ID',
      description:
        'The annotation id, numeric or "gid://shopify/AnalyticsAnnotation/…", as returned by create_analytics_annotation.',
      required: true,
    }),
    type: shopifyProps.staticChoice({
      displayName: 'Type',
      description: 'New kind of event. Leave empty to keep it.',
      required: false,
      values: analyticsFields.ANALYTICS_ANNOTATION_TYPES,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'New chart marker text, at most 75 characters. Leave empty to keep it.',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'New plain-text context, at most 150 characters. Leave empty to keep it.',
      required: false,
    }),
    clear_description: Property.Checkbox({
      displayName: 'Clear Description',
      description: 'Remove the description. Do not combine with Description.',
      required: false,
      defaultValue: false,
    }),
    started_at: Property.ShortText({
      displayName: 'Started At',
      description: 'New start, ISO 8601 with a time zone, for example 2026-11-28T00:00:00Z. Leave empty to keep it.',
      required: false,
    }),
    ended_at: Property.ShortText({
      displayName: 'Ended At',
      description: 'New end, ISO 8601 with a time zone. Leave empty to keep it.',
      required: false,
    }),
    make_open_ended: Property.Checkbox({
      displayName: 'Make Open-Ended',
      description: 'Remove the end so the event shows as still running. Do not combine with Ended At.',
      required: false,
      defaultValue: false,
    }),
  },
  outputSchema: analyticsAnnotationOutputSchema,
  async run({ auth, propsValue }) {
    const startedAt = analyticsValues.readDateTime({ value: propsValue.started_at, label: 'started_at' });
    const endedAt = shopifyValues.clearableValue({
      value: analyticsValues.readDateTime({ value: propsValue.ended_at, label: 'ended_at' }),
      clear: propsValue.make_open_ended,
      valueName: 'ended_at',
      clearName: 'make_open_ended',
    });
    analyticsValues.checkDateTimeOrder({ startedAt, endedAt: endedAt ?? undefined });
    const input = shopifyValues.compact({
      type: analyticsValues.readAnnotationType(propsValue.type),
      title: analyticsValues.readBoundedText({
        value: propsValue.title,
        label: 'title',
        max: analyticsFields.ANNOTATION_TITLE_MAX,
      }),
      description: shopifyValues.clearableValue({
        value: analyticsValues.readBoundedText({
          value: propsValue.description,
          label: 'description',
          max: analyticsFields.ANNOTATION_DESCRIPTION_MAX,
        }),
        clear: propsValue.clear_description,
        valueName: 'description',
        clearName: 'clear_description',
      }),
      startedAt,
      endedAt,
    });
    if (Object.keys(input).length === 0) {
      throw new Error(
        'Nothing to update: provide type, title, description, clear_description, started_at, ended_at or make_open_ended. Nothing was changed.'
      );
    }
    const id = shopifyGraphqlClient.toGid({ type: 'AnalyticsAnnotation', id: propsValue.annotation_id });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      analyticsAnnotationUpdate: { analyticsAnnotation: GqlAnalyticsAnnotation | null } | null;
    }>({
      auth,
      query: `mutation UpdateAnalyticsAnnotation($id: ID!, $input: AnalyticsAnnotationUpdateInput!) { analyticsAnnotationUpdate(id: $id, input: $input) { analyticsAnnotation { ${analyticsFields.ANALYTICS_ANNOTATION_FIELDS} } userErrors { field message code } } }`,
      variables: { id, input },
    });
    const annotation = data.analyticsAnnotationUpdate?.analyticsAnnotation;
    if (!annotation) {
      throw new Error('Shopify did not return the updated analytics annotation.');
    }
    return {
      ...analyticsMappers.mapAnalyticsAnnotation(annotation),
      redacted_fields: redactedFields,
    };
  },
});
