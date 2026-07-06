import { meistertaskAuth } from '../auth';
import { makeRequest, meisterTaskCommon } from '../common/common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';

export const findLabel = createAction({
  auth: meistertaskAuth,
  name: 'find_label',
  displayName: 'Find Label',
  description: 'Finds a label by searching',
  audience: 'both',
  aiMetadata: { description: 'Search a MeisterTask project\'s labels by name and return the first one whose name contains the given text (case-insensitive). Use to resolve a label name to its record/ID before tagging tasks. Read-only and idempotent. Requires the project and a name; returns null if no label matches.', idempotent: true },
  props: {
    project: meisterTaskCommon.project,
    name: Property.ShortText({
      displayName: 'Label Name',
      required: true,
    }),
  },
  async run(context) {
    const token = context.auth.access_token;
    const { project, name } = context.propsValue;

    const response = await makeRequest(
      HttpMethod.GET,
      `/projects/${project}/labels`,
      token
    );

    const labels = response.body.filter((label: any) =>
      label.name.toLowerCase().includes(name.toLowerCase())
    );

    return labels.length > 0 ? labels[0] : null;
  },
});
