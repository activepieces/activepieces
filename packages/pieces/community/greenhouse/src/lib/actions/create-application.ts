import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { greenhouseAuth } from '../auth';
import { compactObject, greenhouseRequest } from '../common/client';
import {
  coordinatorIdProp,
  initialStageIdProp,
  jobIdProp,
  onBehalfOfProp,
  recruiterIdProp,
  sourceIdProp,
} from '../common/props';

export const createApplicationAction = createAction({
  name: 'create_application',
  displayName: 'Create Application',
  description: 'Create a new Greenhouse application for an existing candidate.',
  auth: greenhouseAuth,
  props: {
    candidateId: Property.Number({
      displayName: 'Candidate ID',
      required: true,
    }),
    jobId: jobIdProp,
    sourceId: sourceIdProp,
    initialStageId: initialStageIdProp,
    recruiterId: recruiterIdProp,
    coordinatorId: coordinatorIdProp,
    onBehalfOf: onBehalfOfProp,
  },
  async run({ auth, propsValue }) {
    const body = compactObject({
      job_id: propsValue.jobId,
      source_id: propsValue.sourceId,
      initial_stage_id: propsValue.initialStageId,
      recruiter_id: propsValue.recruiterId,
      coordinator_id: propsValue.coordinatorId,
    });

    return greenhouseRequest({
      auth,
      method: HttpMethod.POST,
      path: `/candidates/${propsValue.candidateId}/applications`,
      onBehalfOf: propsValue.onBehalfOf,
      body,
    });
  },
});
