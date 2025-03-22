import { createAction, Property } from '@activepieces/pieces-framework';
import { zooAuth } from '../../../index'
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const convertCadFileAction = createAction({
  name: 'convert_cad_file',
  displayName: 'Convert CAD File',
  description: 'Convert a CAD file from one format to another',
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
    formData.append('file', new Blob([propsValue.file.data]), propsValue.file.filename);

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `https://api.zoo.dev/file/conversion/${propsValue.sourceFormat}/${propsValue.outputFormat}`,
      headers: {
        Authorization: `Bearer ${auth}`,
      },
      body: formData,
    });
    return response.body;
  },
});
