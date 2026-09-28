import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

import { retableAuth } from '../..';
import { retableCommon } from '../common';

export const retableGetProjectAction = createAction({
  auth: retableAuth,
  name: 'retable_get_project',
  classification: 'READ',
  displayName: 'Get Specific Project',
  description: 'Gets a single project by id, including its nested retables',
  audience: 'ai',
  aiMetadata: { description: 'Reads one Retable project by id, including its nested tables (paginated). Use when the project id is already known and a full listing isn\'t needed. Idempotent read.', idempotent: true },
  props: {
    project_id: retableCommon.project_id(),
    limit: Property.Number({
      displayName: 'Limit',
      required: false,
    }),
    offset: Property.Number({
      displayName: 'Offset',
      required: false,
    }),
  },
  async run(context) {
    const { project_id, limit, offset } = context.propsValue;
    return (
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${retableCommon.baseUrl}/project/${project_id}`,
        headers: {
          ApiKey: context.auth.secret_text,
        },
        queryParams: {
          ...(limit !== undefined ? { limit: String(limit) } : {}),
          ...(offset !== undefined ? { offset: String(offset) } : {}),
        },
      })
    ).body;
  },
});
