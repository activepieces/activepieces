import { createAction, Property } from '@activepieces/pieces-framework';
import { addAnnotation } from '../api';
import { matomoAuth } from '../auth';

export const addAnnotationAction = createAction({
  name: 'add_annotation',
  auth: matomoAuth,
  displayName: 'Add Annotation',
  description: 'Add an annotation to a Matomo site',
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
    return await addAnnotation(context.auth, {
      note: context.propsValue.note,
      date: context.propsValue.date,
      starred: context.propsValue.starred ? '1' : '0',
    });
  },
});
