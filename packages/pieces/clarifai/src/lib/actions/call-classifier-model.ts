import { clarifaiAuth } from "../../"
import { Property, createAction } from "@activepieces/pieces-framework";
import { CommonClarifaiProps, callClarifaiModel, removeListFromPropertyNames } from "../common";
import { Data } from 'clarifai-nodejs-grpc/proto/clarifai/api/resources_pb';


export const callClassifierModel = createAction({
    auth: clarifaiAuth,
    name: 'call_classifier_model',
    description: 'Call a classifier model',
    displayName: 'Classify Image',
    props: {
        modelUrl: CommonClarifaiProps.modelUrl,
        input: Property.File({
            description: 'URL or base64 bytes of the image to classify',
            displayName: 'Input URL or bytes',
            required: true,
        }),
    },
    sampleData: { },
    async run(ctx) {
        const { auth } = ctx
        const { modelUrl, input } = ctx.propsValue;

        const outputs = await callClarifaiModel({
          auth,
          modelUrl,
          input,
        });
        if (outputs.getOutputsList().length === 0) {
            throw new Error('No outputs found from Clarifai');
        }
        const data = outputs.getOutputsList()[0].getData();
        if (data == undefined) {
            throw new Error('No data found from Clarifai');
        } else {
            const result = Data.toObject(false, data);
            return removeListFromPropertyNames(result);
        }
    },
});
