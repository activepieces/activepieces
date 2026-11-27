import { createAction, Property } from '@activepieces/pieces-framework';
import { shotstackAuth } from '../auth';
import { shotstackApi } from '../common';
import { generationProps } from '../generation';

export const generateAsset = createAction({
  auth: shotstackAuth,
  name: 'generate_asset',
  classification: 'WRITE',
  displayName: 'Generate Asset',
  description: 'Generates one AI image, video or audio file from a prompt and returns its URL. Uses credits.',
  audience: 'both',
  aiMetadata: {
    description:
      'Generate a single AI image, video or audio file from a text prompt and return its hosted URL, to use as an asset in a later render. Bills credits in Sandbox and Production: use Quote Generation for the cost and List Generation Models to pick a model first. Each call can start and bill a new generation, so do not retry blindly.',
    idempotent: false,
  },
  props: {
    ...generationProps,
    wait: Property.Checkbox({
      displayName: 'Wait for the Asset',
      description:
        'On: the step waits up to 8 minutes and returns the file URL. Off: it returns the generation ID straight away; check it later with Get Generation Status.',
      required: false,
      defaultValue: true,
    }),
  },
  async run({ auth, propsValue }) {
    return shotstackApi.startGeneration({
      connection: auth.props,
      body: shotstackApi.generationBody(propsValue),
      wait: propsValue.wait,
    });
  },
});
