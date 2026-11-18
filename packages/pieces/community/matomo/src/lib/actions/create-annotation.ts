import { createAction, Property } from '@activepieces/pieces-framework';
import { matomoApi } from '../api';
import { matomoAuth } from '../auth';
import { matomoProps, matomoUtils } from '../common/props';

export const createAnnotationAction = createAction({
  name: 'create_annotation',
  classification: 'WRITE',
  auth: matomoAuth,
  displayName: 'Create Annotation',
  description: 'Add a dated annotation to a Matomo site.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a dated annotation (a note marking an event) on a Matomo site so it shows on the analytics graphs, e.g. a deployment, campaign launch or outage. Requires the note text and date as YYYY-MM-DD (in the site timezone). siteId is optional; use List Sites to find it, otherwise the connection site is used. starred is "yes" or "no" (default "no"). Returns the created annotation with its idNote, which Delete Annotation needs. Not idempotent: each call adds a new annotation, even with identical input.',
    idempotent: false,
  },
  props: {
    note: Property.ShortText({ displayName: 'Note', description: 'The annotation text.', required: true, placeholder: 'Launched new pricing page' }),
    date: Property.ShortText({ displayName: 'Date', description: 'The day to annotate, as YYYY-MM-DD.', required: true, placeholder: '2026-01-31' }),
    starred: Property.StaticDropdown({
      displayName: 'Starred',
      description: 'Whether the annotation is starred.',
      required: false,
      defaultValue: 'no',
      options: { disabled: false, options: [{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }] },
    }),
    siteId: matomoProps.siteIdDropdown(),
  },
  outputSchema: matomoUtils.annotationOutputSchema,
  async run(context) {
    const { note, date, starred, siteId } = context.propsValue;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date.trim())) {
      throw new Error('Date must be in YYYY-MM-DD format.');
    }
    const created = await matomoApi.call({
      auth: context.auth.props,
      method: 'Annotations.add',
      idSite: siteId,
      params: { note, date: date.trim(), starred: starred === 'yes' ? 1 : 0 },
    });
    return matomoUtils.toAnnotation(created);
  },
});
