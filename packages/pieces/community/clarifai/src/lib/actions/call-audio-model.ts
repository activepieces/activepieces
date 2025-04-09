import { Property, createAction } from '@activepieces/pieces-framework'
import { Data } from 'clarifai-nodejs-grpc/proto/clarifai/api/resources_pb'
import { clarifaiAuth } from '../../'
import { CommonClarifaiProps, callClarifaiModel, cleanMultiOutputResponse, fileToInput } from '../common'

export const audioToTextModelPredictAction = createAction({
  auth: clarifaiAuth,
  name: 'audio_text_model',
  description: 'Call a audio to text AI model',
  displayName: 'Audio to Text',
  props: {
    modelUrl: CommonClarifaiProps.modelUrl,
    file: Property.File({
      description: 'URL or base64 bytes of the audio to classify',
      displayName: 'Input URL or bytes',
      required: true,
    }),
  },
  async run(ctx) {
    const { auth } = ctx
    const { modelUrl, file } = ctx.propsValue

    const input = fileToInput(file)

    const outputs = await callClarifaiModel({
      auth,
      modelUrl,
      input,
    })
    return cleanMultiOutputResponse(outputs)
  },
})
