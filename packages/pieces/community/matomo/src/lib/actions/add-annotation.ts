import { createAction, Property } from '@activepieces/pieces-framework';
import { matomoApi } from '../api';
import { matomoAuth } from '../auth';
import { matomoProps, matomoUtils } from '../common/props';

export const addAnnotationAction = createAction({
  name: 'add_annotation',
  classification: 'WRITE',
  auth: matomoAuth,
  displayName: 'Add Annotation',
  description: 'Add an annotation to a Matomo site',
  audience: 'human',
  props: {
    note: Property.ShortText({
      displayName: 'Note',
      description: 'Text shown on the Matomo evolution graph.',
      placeholder: 'Launched new pricing page',
      required: true,
    }),
    date: Property.DateTime({
      displayName: 'Date',
      description: 'The day to add the note to. Only the date part is used (YYYY-MM-DD).',
      required: true,
    }),
    starred: Property.Checkbox({
      displayName: 'Starred',
      description: 'Pin the note as important.',
      required: false,
      defaultValue: false,
    }),
    siteId: matomoProps.siteIdDropdown(),
  },
  outputSchema: matomoUtils.annotationOutputSchema,
  async run(context) {
    const { note, date, starred, siteId } = context.propsValue;
    const created = await matomoApi.call({
      auth: context.auth.props,
      method: 'Annotations.add',
      idSite: siteId,
      params: {
        note,
        date: matomoUtils.toAnnotationDate(date),
        starred: starred ? 1 : 0,
      },
    });
    return matomoUtils.toAnnotation(created);
  },
});
