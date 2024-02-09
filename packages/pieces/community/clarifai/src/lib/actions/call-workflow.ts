import { clarifaiAuth } from '../../';
import { Property, createAction } from '@activepieces/pieces-framework';
import {
  CommonClarifaiProps,
  callClarifaiWorkflow,
  cleanPostWorkflowResultsResponse,
  fileToInput,
} from '../common';
import { Data } from 'clarifai-nodejs-grpc/proto/clarifai/api/resources_pb';

export const workflowPredictAction = createAction({
  auth: clarifaiAuth,
  name: 'workflow_predict',
  description: 'Call a Clarifai workflow',
  displayName: 'Run Workflow',
  props: {
    workflowUrl: CommonClarifaiProps.workflowUrl,
    file: Property.File({
      description:
        'URL or base64 bytes of the incoming image/video/text/audio to run through the workflow. Note: must be appropriate first step of the workflow to handle that data type.',
      displayName: 'Input URL or bytes',
      required: true,
    }),
  },
  async run(ctx) {
    const { auth } = ctx;
    const { workflowUrl, file } = ctx.propsValue;

    const input = fileToInput(file);

    const outputs = await callClarifaiWorkflow({
      auth,
      workflowUrl,
      input,
    });
    return cleanPostWorkflowResultsResponse(outputs);
  },
});
