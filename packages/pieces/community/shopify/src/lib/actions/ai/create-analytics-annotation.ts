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

export const shopifyAiCreateAnalyticsAnnotation = createAction({
  auth: shopifyAuth,
  name: 'create_analytics_annotation',
  classification: 'WRITE',
  displayName: 'Create Analytics Annotation',
  description: 'Mark a notable event (launch, campaign, redesign…) on the store\'s analytics charts.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Adds an annotation to the store\'s analytics timeline, so Shopify Analytics charts show a marker that explains a change in the numbers, for example a campaign, a product launch, a price test or a store redesign. type is one of the annotation types apps may create (for example campaign, product_launch, store_redesign, seasonal_promotion, ad_spend_change, other). title is required (at most 75 characters), description optional (at most 150). started_at and ended_at are ISO 8601 date-times with a time zone, for example 2026-11-28T00:00:00Z: leave ended_at empty for a point-in-time marker, or set open_ended for an event that is still running. The annotation is attributed to this app. There is NO action to list annotations, so keep the returned id: update_analytics_annotation and delete_analytics_annotation need it, and they only work on annotations this app created. Shopify caps how many annotations one app may keep per shop; past the cap it answers LIMIT_REACHED, and then an annotation must be deleted (by its saved id) or Shopify Support asked for a higher limit. Not idempotent: every call adds another annotation, so do not retry after a success. Needs the write_analytics_annotations access scope.',
    idempotent: false,
  },
  props: {
    type: shopifyProps.staticChoice({
      displayName: 'Type',
      description: 'The kind of event, for example campaign, product_launch, store_redesign or other.',
      required: true,
      values: analyticsFields.ANALYTICS_ANNOTATION_TYPES,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Text shown on the chart marker, at most 75 characters.',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Optional extra context, plain text, at most 150 characters.',
      required: false,
    }),
    started_at: Property.ShortText({
      displayName: 'Started At',
      description: 'When the event started, ISO 8601 with a time zone, for example 2026-11-28T00:00:00Z.',
      required: true,
    }),
    ended_at: Property.ShortText({
      displayName: 'Ended At',
      description:
        'When the event ended, ISO 8601 with a time zone. Leave empty for a point-in-time marker. Must not be before Started At.',
      required: false,
    }),
    open_ended: Property.Checkbox({
      displayName: 'Open-Ended',
      description: 'The event is still running and has no end yet. Do not combine with Ended At.',
      required: false,
      defaultValue: false,
    }),
  },
  outputSchema: analyticsAnnotationOutputSchema,
  async run({ auth, propsValue }) {
    const type = analyticsValues.readAnnotationType(propsValue.type);
    if (type === undefined) {
      throw new Error('type is required, for example campaign. Nothing was changed.');
    }
    const title = analyticsValues.readBoundedText({
      value: propsValue.title,
      label: 'title',
      max: analyticsFields.ANNOTATION_TITLE_MAX,
    });
    if (title === undefined) {
      throw new Error('title is required. Nothing was changed.');
    }
    const description = analyticsValues.readBoundedText({
      value: propsValue.description,
      label: 'description',
      max: analyticsFields.ANNOTATION_DESCRIPTION_MAX,
    });
    const startedAt = analyticsValues.readDateTime({ value: propsValue.started_at, label: 'started_at' });
    if (startedAt === undefined) {
      throw new Error('started_at is required, for example 2026-11-28T00:00:00Z. Nothing was changed.');
    }
    const endedAt = shopifyValues.clearableValue({
      value: analyticsValues.readDateTime({ value: propsValue.ended_at, label: 'ended_at' }),
      clear: propsValue.open_ended,
      valueName: 'ended_at',
      clearName: 'open_ended',
    });
    analyticsValues.checkDateTimeOrder({ startedAt, endedAt: endedAt ?? undefined });
    const input = shopifyValues.compact({ type, title, description, startedAt, endedAt });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      analyticsAnnotationCreate: { analyticsAnnotation: GqlAnalyticsAnnotation | null } | null;
    }>({
      auth,
      query: `mutation CreateAnalyticsAnnotation($input: AnalyticsAnnotationCreateInput!) { analyticsAnnotationCreate(input: $input) { analyticsAnnotation { ${analyticsFields.ANALYTICS_ANNOTATION_FIELDS} } userErrors { field message code } } }`,
      variables: { input },
    });
    const annotation = data.analyticsAnnotationCreate?.analyticsAnnotation;
    if (!annotation) {
      throw new Error('Shopify did not return the created analytics annotation.');
    }
    return {
      ...analyticsMappers.mapAnalyticsAnnotation(annotation),
      redacted_fields: redactedFields,
    };
  },
});
