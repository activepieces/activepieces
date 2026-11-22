import { createAction } from '@activepieces/pieces-framework';
import { matomoApi } from '../api';
import { matomoAuth } from '../auth';
import { matomoProps, matomoUtils } from '../common/props';

export const listAnnotationsAction = createAction({
  name: 'list_annotations',
  classification: 'SEARCH',
  auth: matomoAuth,
  displayName: 'List Annotations',
  description: 'List the annotations of a Matomo site for a period.',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists the annotations (dated notes such as deployments or campaign launches) on a Matomo site for a period. period is day, week, month, year or range; date is today, yesterday or YYYY-MM-DD, and for range YYYY-MM-DD,YYYY-MM-DD or lastN (e.g. last30). Defaults to today. siteId is optional (connection site otherwise). Returns annotations with idNote, date, note, starred and user, plus count. Use the idNote with Delete Annotation. Read-only.',
    idempotent: true,
  },
  props: {
    period: matomoProps.periodDropdown({ required: false }),
    date: matomoProps.dateText({ required: false }),
    siteId: matomoProps.siteIdDropdown(),
  },
  outputSchema: {
    fields: [
      { key: 'count', label: 'Annotations Found', format: 'number' },
      { key: 'annotations', label: 'Annotations', labelKey: 'note', listItems: matomoUtils.annotationOutputSchema.fields },
    ],
  },
  async run(context) {
    const { siteId, period, date } = context.propsValue;
    const resolved = matomoUtils.resolvePeriod({ period, date });
    const response = await matomoApi.call({
      auth: context.auth.props,
      method: 'Annotations.getAll',
      idSite: siteId,
      params: resolved,
    });
    const annotations = matomoUtils.flattenAnnotations({ value: response, depth: 0 }).map(matomoUtils.toAnnotation);
    return { count: annotations.length, annotations };
  },
});

