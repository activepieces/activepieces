import { clarifaiAuth } from "../../"
import { Property, createAction } from "@activepieces/pieces-framework";
import { CommonClarifaiProps, callClarifaiModel, cleanMultiOutputResponse, fileToInput, textToInput } from "../common";
import { Data } from 'clarifai-nodejs-grpc/proto/clarifai/api/resources_pb';



export const callImageClassifierModel = createAction({
    auth: clarifaiAuth,
    name: 'image_classifier_model',
    description: 'Call an image classifier model',
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

export const callTextClassifierModel = createAction({
    auth: clarifaiAuth,
    name: 'text_classifier_model',
    description: 'Call a text classifier model',
    displayName: 'Classify Text',
    props: {
        modelUrl: CommonClarifaiProps.modelUrl,
        txt: Property.LongText({
            description: 'Text to classify',
            displayName: 'Input Text',
            required: true,
        }),
    },
    sampleData: { },
    async run(ctx) {
        const { auth } = ctx
        const { modelUrl, txt } = ctx.propsValue;

        const input = textToInput(txt);

        const outputs = await callClarifaiModel({
          auth,
          modelUrl,
          input,
        });
        return cleanMultiOutputResponse(outputs);
    },
});
