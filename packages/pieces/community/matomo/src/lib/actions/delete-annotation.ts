import { createAction } from '@activepieces/pieces-framework';
import { matomoApi } from '../api';
import { matomoAuth } from '../auth';
import { matomoProps } from '../common/props';

export const deleteAnnotationAction = createAction({
  name: 'delete_annotation',
  classification: 'DESTRUCTIVE',
  auth: matomoAuth,
  displayName: 'Delete Annotation',
  description: 'Permanently delete an annotation from a Matomo site.',
  audience: 'both',
  aiMetadata: {
    description:
      'Permanently deletes one annotation from a Matomo site by its idNote (get it from List Annotations or Create Annotation). siteId must be the site the annotation belongs to; it defaults to the connection site. Cannot be undone. Returns deleted and idNote. Not idempotent: deleting an annotation that no longer exists returns an error.',
    idempotent: false,
  },
  props: {
    siteId: matomoProps.siteIdDropdown(),
    idNote: matomoProps.annotationDropdown(),
  },
  outputSchema: {
    fields: [
      { key: 'deleted', label: 'Deleted', format: 'boolean' },
      { key: 'idNote', label: 'Annotation ID', format: 'number' },
    ],
  },
  async run(context) {
    const { idNote, siteId } = context.propsValue;
    await matomoApi.call({ auth: context.auth.props, method: 'Annotations.delete', idSite: siteId, params: { idNote } });
    return { deleted: true, idNote };
  },
});
