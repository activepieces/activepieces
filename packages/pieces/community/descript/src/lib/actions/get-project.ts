import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { descriptAuth } from '../auth';
import { descriptCommon } from '../common';

type Composition = {
  id: string;
  name: string;
  duration?: number;
  media_type?: string;
};

type MediaFile = {
  type: string;
  duration?: number;
};

type ProjectDetailResponse = {
  id: string;
  name: string;
  drive_id: string;
  created_at: string;
  updated_at: string;
  media_files: Record<string, MediaFile>;
  compositions: Composition[];
};

export const descriptGetProjectAction = createAction({
  auth: descriptAuth,
  name: 'get_project',
  displayName: 'Get Project',
  description:
    'Retrieves details for a Descript project including its compositions and media files.',
  props: {
    project_id: descriptCommon.projectIdProp,
  },
  async run(context) {
    const response =
      await descriptCommon.descriptApiCall<ProjectDetailResponse>({
        apiKey: descriptCommon.getAuthToken(context.auth),
        method: HttpMethod.GET,
        path: `/projects/${context.propsValue.project_id}`,
      });

    return response.body;
  },
});
