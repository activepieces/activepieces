import { clarifaiAuth } from "../../"
import { Property, createAction } from "@activepieces/pieces-framework";
import { CommonClarifaiProps, callClarifaiModel, cleanMultiOutputResponse, fileToInput } from "../common";
import { Data } from 'clarifai-nodejs-grpc/proto/clarifai/api/resources_pb';

export const imageClassifierModelPredictAction = createAction({
    auth: clarifaiAuth,
    name: 'image_classifier_model',
    description: 'Call an image classifier AI model to recognize concepts',
    displayName: 'Classify Image',
    props: {
        modelUrl: CommonClarifaiProps.modelUrl,
        file: Property.File({
            description: 'URL or base64 bytes of the image to classify',
            displayName: 'Input URL or bytes',
            required: true,
        }),
    },
    sampleData: { },
    async run(ctx) {
        const { auth } = ctx
        const { modelUrl, file } = ctx.propsValue;

        const input = fileToInput(file);

        const outputs = await callClarifaiModel({
          auth,
          modelUrl,
          input,
        });
        return cleanMultiOutputResponse(outputs);
    },
});


export const imageToTextModelPredictAction = createAction({
    auth: clarifaiAuth,
    name: 'image_text_model',
    description: 'Call an image to text AI model',
    displayName: 'Image to Text',
    props: {
        modelUrl: CommonClarifaiProps.modelUrl,
        file: Property.File({
            description: 'URL or base64 bytes of the image to classify',
            displayName: 'Input URL or bytes',
            required: true,
        }),
    },
    sampleData: { },
    async run(ctx) {
        const { auth } = ctx
        const { modelUrl, file } = ctx.propsValue;

        const input = fileToInput(file);

        const outputs = await callClarifaiModel({
          auth,
          modelUrl,
          input,
        });
        return cleanMultiOutputResponse(outputs);
    },
});
