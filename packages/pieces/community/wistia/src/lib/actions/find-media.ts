import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { wistiaAuth } from '../../';
import { flattenMedia, wistiaApiCall, wistiaCommon, WistiaMedia } from '../common';

export const findMediaAction = createAction({
  auth: wistiaAuth,
  name: 'find_media',
  displayName: 'Find Media',
  description: 'Search and list media in your account, optionally filtered by project, name, or type.',
  props: {
    projectId: wistiaCommon.projectIdDropdown(false),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Only return media whose name exactly matches this value.',
      required: false,
    }),
    type: Property.StaticDropdown({
      displayName: 'Type',
      description: 'Only return media of this type.',
      required: false,
      options: {
        options: [
          { label: 'Video', value: 'Video' },
          { label: 'Audio', value: 'Audio' },
          { label: 'Image', value: 'Image' },
          { label: 'PDF Document', value: 'PdfDocument' },
          { label: 'Microsoft Office Document', value: 'MicrosoftOfficeDocument' },
          { label: 'Flash (Swf)', value: 'Swf' },
          { label: 'Unknown', value: 'UnknownType' },
        ],
      },
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of media to return (up to 100).',
      required: false,
      defaultValue: 25,
    }),
  },
  async run(context) {
    const { projectId, name, type, limit } = context.propsValue;

    const response = await wistiaApiCall<WistiaMedia[]>({
      token: context.auth.secret_text,
      method: HttpMethod.GET,
      resourceUrl: '/medias.json',
      query: {
        project_id: projectId,
        name,
        type,
        per_page: Math.min(limit ?? 25, 100),
        sort_by: 'created',
        sort_direction: 0,
      },
    });

    return response.body.map(flattenMedia);
  },
});
