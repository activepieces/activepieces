import { clarifaiAuth } from "../../"
import { Property, createAction } from "@activepieces/pieces-framework";
import { CommonClarifaiProps, callClarifaiModel } from "../common";

export const callClassifierModel = createAction({
    auth: clarifaiAuth,
    name: 'call_classifier_model',
    description: 'Call a classifier model',
    displayName: 'Classify Image',
    props: {
        userId: CommonClarifaiProps.userId,
        appId: CommonClarifaiProps.appId,
        // todo: change modelId and modelversionId to dropdowns
        modelId: Property.ShortText({
            description: 'Model ID of the model to call',
            displayName: 'Model ID',
            required: true,
        }),
        latestVersion: Property.Checkbox({
            description: 'Use the latest version of the model',
            displayName: 'Latest Version',
            required: true,
        }),
        modelVersionId: Property.ShortText({
            description: 'Model Version ID to call',
            displayName: 'Model Version ID',
            required: false,
            defaultValue: '',
        }),
        inputUrl: Property.ShortText({
            description: 'Input URL',
            displayName: 'Input URL',
            required: true,
        }),
    },
    sampleData: {},
    async run(ctx) {
        const { auth } = ctx
        const { userId, appId, modelId, modelVersionId, latestVersion, inputUrl } = ctx.propsValue;

        const outputs = await callClarifaiModel({
          auth: [auth, userId, appId],
          modelId,
          modelVersionId,
          latestVersion,
          input: inputUrl,
        });
        const list = outputs.getOutputsList()[0].getData()?.getConceptsList() || [];

        const result = list.map((item) => {
          return {
            id: item.getId(),
            name: item.getName(),
            value: item.getValue(),
          };
        });

        console.log(result);
        return result;
    },
});
