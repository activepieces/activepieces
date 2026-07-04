import { createAction, Property } from '@activepieces/pieces-framework';
import { zooAuth } from '../../auth'
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const generateCadModelAction = createAction({
  name: 'generate_cad_model',
  displayName: 'Generate CAD Model',
  description: 'Generate a 3D model from text prompt',
  audience: 'both',
  aiMetadata: { description: 'Submit a text prompt to Zoo\'s text-to-CAD ML model to generate a new 3D model in a chosen export format (FBX, GLB, GLTF, OBJ, PLY, STEP, or STL). Each call starts a new generation job, so it is not idempotent. Optionally include KCL source in the output; retrieve finished results with the get CAD model action.', idempotent: false },
  auth: zooAuth,
  // category: 'Machine Learning (ML)',
  props: {
    outputFormat: Property.StaticDropdown({
      displayName: 'Output Format',
      required: true,
      options: {
        options: [
          { label: 'FBX', value: 'fbx' },
          { label: 'GLB', value: 'glb' },
          { label: 'GLTF', value: 'gltf' },
          { label: 'OBJ', value: 'obj' },
          { label: 'PLY', value: 'ply' },
          { label: 'STEP', value: 'step' },
          { label: 'STL', value: 'stl' },
        ],
      },
    }),
    outputKcl: Property.Checkbox({
      displayName: 'Include KCL Output',
      required: false,
    }),
    prompt: Property.ShortText({
      displayName: 'Prompt',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `https://api.zoo.dev/ai/text-to-cad/${propsValue.outputFormat}`,
      headers: {
        Authorization: `Bearer ${auth.secret_text}`,
      },
      body: {
        output_kcl: propsValue.outputKcl,
        prompt: propsValue.prompt,
      },
    });
    return response.body;
  },
});
