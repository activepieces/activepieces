import { HttpMethod, httpClient } from '@activepieces/pieces-common'
import { Property, createAction } from '@activepieces/pieces-framework'
import { zooAuth } from '../../../index'

export const getVolumeAction = createAction({
  name: 'get_volume',
  displayName: 'Get Volume',
  description: 'Calculate the volume of a CAD file',
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
    const formData = new FormData()
    formData.append('file', new Blob([propsValue.file.data]), propsValue.file.filename)

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.zoo.dev/file/volume',
      headers: {
        Authorization: `Bearer ${auth}`,
      },
      body: formData,
    })
    return response.body
  },
})
