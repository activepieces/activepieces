import { HttpMethod } from '@activepieces/pieces-common'
import { Property, createAction } from '@activepieces/pieces-framework'
import { pipedriveAuth } from '../../index'
import { pipedriveApiCall } from '../common'

export const getNoteAction = createAction({
  auth: pipedriveAuth,
  name: 'get-note',
  displayName: 'Retrieve a Note',
  description: ' Finds a note by ID.',
  props: {
    noteId: Property.Number({
      displayName: 'Note ID',
      required: true,
    }),
  },
  async run(context) {
    try {
      const response = await pipedriveApiCall({
        accessToken: context.auth.access_token,
        apiDomain: context.auth.data['api_domain'],
        method: HttpMethod.GET,
        resourceUri: `/notes/${context.propsValue.noteId}`,
      })
      return response
    } catch (error) {
      return {
        success: false,
      }
    }
  },
})
