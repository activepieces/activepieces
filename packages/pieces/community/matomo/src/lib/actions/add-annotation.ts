import { createAction, Property } from '@activepieces/pieces-framework';
import { addAnnotation } from '../api';
import { matomoAuth } from '../auth';

export const addAnnotationAction = createAction({
  name: 'add_annotation',
  auth: matomoAuth,
  displayName: 'Add Annotation',
  description: 'Add an annotation to a Matomo site',
  audience: 'both',
  aiMetadata: { description: 'Creates a dated annotation (a note marking an event) on the configured Matomo site, optionally starred. Use to flag a date in analytics reports, e.g. tagging a deployment or campaign launch. Requires the note text and a date in YYYY-MM-DD format. Not idempotent: each call adds a new annotation, even with identical input.', idempotent: false },
  props: {
    note: Property.ShortText({
      displayName: 'Note',
      description: 'The note to add',
      required: true,
    }),
    date: Property.DateTime({
      displayName: 'Date',
      description: 'The date to add the note to. Format: YYYY-MM-DD',
      required: true,
    }),
    starred: Property.Checkbox({
      displayName: 'Starred',
      description: 'Whether or not the note should be starred',
      required: true,
    }),
  },
  async run(context) {
    return await addAnnotation(context.auth.props, {
      note: context.propsValue.note,
      date: context.propsValue.date,
      starred: context.propsValue.starred ? '1' : '0',
    });
  },
});
