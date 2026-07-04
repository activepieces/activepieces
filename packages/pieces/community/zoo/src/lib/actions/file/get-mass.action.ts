import { createAction, Property } from '@activepieces/pieces-framework';
import { zooAuth } from '../../auth'
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getMassAction = createAction({
  name: 'get_mass',
  displayName: 'Get Mass',
  description: 'Calculate the mass of a CAD file',
  audience: 'both',
  aiMetadata: { description: 'Compute the mass of a 3D solid from an uploaded CAD file (FBX, GLB, glTF, OBJ, PLY, STEP, or STL). Pick this for total mass specifically; sibling actions cover density, volume, surface area, and center of mass. Read-only analysis that does not modify the file and returns the same value for the same input.', idempotent: true },
  auth: zooAuth,
  // category: 'File Operations',
  props: {
    file: Property.File({
      displayName: 'CAD File',
      required: true,
      description: 'The CAD file to analyze',
    }),
  },
  async run({ auth, propsValue }) {
    const formData = new FormData();
    formData.append('file', new Blob([propsValue.file.data as any]), propsValue.file.filename);

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.zoo.dev/file/mass',
      headers: {
        Authorization: `Bearer ${auth.secret_text}`,
      },
      body: formData,
    });
    return response.body;
  },
});
