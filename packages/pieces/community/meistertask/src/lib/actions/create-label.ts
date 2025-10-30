import { createAction, Property } from '@activepieces/pieces-framework';
import { meisterTaskCommon } from '../common/common';
import { meistertaskAuth } from '../../index';
import { HttpMethod } from '@activepieces/pieces-common';


export const createLabel = createAction({
  auth: meistertaskAuth,
  name: 'create_label',
  displayName: 'Create Label',
  description: 'Creates a new label',
  props: {
    project_id: Property.ShortText({
      displayName: 'Project ID',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Label Name',
      required: true,
    }),
    color: Property.ShortText({
      displayName: 'Color',
      description: 'Hex color code (e.g., #FF0000)',
      required: false,
    }),
  },
  
  async run(context) {
    const { project_id, name, color } = context.propsValue;
    
    return await meisterTaskCommon.makeRequest(
      HttpMethod.POST,
      `/projects/${project_id}/labels`,
      context.auth.access_token,
      { name, color }
    );
  },
});
