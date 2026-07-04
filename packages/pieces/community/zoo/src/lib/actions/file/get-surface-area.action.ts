import { createAction, Property } from '@activepieces/pieces-framework';
import { zooAuth } from '../../auth'
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getSurfaceAreaAction = createAction({
  name: 'get_surface_area',
  displayName: 'Get Surface Area',
  description: 'Calculate the surface area of a CAD file',
  audience: 'both',
  aiMetadata: { description: 'Compute the total surface area of a 3D solid from an uploaded CAD file (FBX, GLB, glTF, OBJ, PLY, STEP, or STL). Pick this for surface area specifically; sibling actions cover mass, density, volume, and center of mass. Read-only analysis that does not modify the file and returns the same value for the same input.', idempotent: true },
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
      url: 'https://api.zoo.dev/file/surface-area',
      headers: {
        Authorization: `Bearer ${auth.secret_text}`,
      },
      body: formData,
    });
    return response.body;
  },
});
