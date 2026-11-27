import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxClient } from '../../../common/client';

export const findMetadataTemplateByInstanceAction = createAction({
  auth: boxAuth,
  name: 'box_find_metadata_template_by_instance',
  displayName: 'Find Metadata Template By Instance',
  description: 'Finds the metadata template a metadata instance was made from.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns the template behind a metadata instance, as a one-entry list, from the instance\'s $id (from Get File Metadata or List File Metadata). Use Get Metadata Template when you already know the scope and template key.',
    idempotent: true,
  },
  props: {
    metadataInstanceId: Property.ShortText({
      displayName: 'Metadata Instance ID',
      description: 'The $id of a metadata instance, a UUID, from Get File Metadata or Get Folder Metadata.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.GET,
      path: '/metadata_templates',
      query: { metadata_instance_id: propsValue.metadataInstanceId },
    });
  },
});
