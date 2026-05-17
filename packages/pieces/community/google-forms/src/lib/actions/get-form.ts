import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { callFormsApi, googleFormsAuth, googleFormsCommon } from '../common/common';

export const getFormAction = createAction({
  auth: googleFormsAuth,
  name: 'get_form',
  displayName: 'Get Form',
  description: 'Retrieves a form\'s metadata, including questions and settings.',
  props: {
    include_team_drives: googleFormsCommon.include_team_drives,
    form_id: googleFormsCommon.form_id,
  },
  async run(context) {
    return await callFormsApi({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/forms/${context.propsValue.form_id}`,
    });
  },
});
