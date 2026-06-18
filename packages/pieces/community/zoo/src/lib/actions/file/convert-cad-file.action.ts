import { createAction, Property } from '@activepieces/pieces-framework';
import { zooAuth } from '../../auth'
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const convertCadFileAction = createAction({
  name: 'convert_cad_file',
  displayName: 'Convert CAD File',
  description: 'Convert a CAD file from one format to another',
  audience: 'both',
  aiMetadata: { description: 'Convert an uploaded CAD file from one 3D format to another; both source and output formats must be chosen from FBX, GLB, glTF, OBJ, PLY, STEP, and STL. Use this for format translation only, not for measuring mass properties (see the get-mass/volume/density/surface-area/center-of-mass actions). The source file is left untouched and the conversion is deterministic for the same inputs.', idempotent: true },
  auth: zooAuth,
  // category: 'File Operations',
  props: {
    file: Property.File({
      displayName: 'CAD File',
      required: true,
      description: 'The CAD file to convert',
    }),
    sourceFormat: Property.StaticDropdown({
      displayName: 'Source Format',
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
  },
  async run({ auth, propsValue }) {
    const formData = new FormData();
    formData.append('file', new Blob([propsValue.file.data as any]), propsValue.file.filename);

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `https://api.zoo.dev/file/conversion/${propsValue.sourceFormat}/${propsValue.outputFormat}`,
      headers: {
        Authorization: `Bearer ${auth.secret_text}`,
      },
      body: formData,
    });
    return response.body;
  },
});
