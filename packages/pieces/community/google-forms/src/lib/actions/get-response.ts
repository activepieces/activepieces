import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpError, HttpMethod } from '@activepieces/pieces-common';
import { callFormsApi, googleFormsAuth, googleFormsCommon } from '../common/common';

export const getResponseAction = createAction({
  auth: googleFormsAuth,
  name: 'get_response',
  displayName: 'Get Response',
  description: 'Retrieves a single response submission by its responseId. Returns { found: false } if not found.',
  props: {
    include_team_drives: googleFormsCommon.include_team_drives,
    form_id: googleFormsCommon.form_id,
    response_id: Property.ShortText({
      displayName: 'Response ID',
      description: 'The id of the response (e.g. ACYDBNh...).',
      required: true,
    }),
  },
  async run(context) {
    const { form_id, response_id } = context.propsValue;
    try {
      const response = await callFormsApi<Record<string, unknown>>({
        auth: context.auth,
        method: HttpMethod.GET,
        path: `/forms/${form_id}/responses/${response_id}`,
      });
      return { found: true, response };
    } catch (e) {
      if (isMissingResource(e)) {
        return { found: false, response: null };
      }
      throw e;
    }
  },
});

function isMissingResource(error: unknown): boolean {
  if (error instanceof HttpError) {
    return error.response?.status === 404;
  }
  return false;
}
