import { clarifaiAuth } from "../../"
import { Property, createAction } from "@activepieces/pieces-framework";
import { CommonClarifaiProps, callClarifaiModel } from "../common";

export const callClassifierModel = createAction({
    auth: clarifaiAuth,
    name: 'call_classifier_model',
    description: 'Call a classifier model',
    displayName: 'Classify Image',
    props: {
        modelUrl: CommonClarifaiProps.modelUrl,
        inputUrl: Property.ShortText({
            description: 'URL of the image to classify',
            displayName: 'Input URL',
            required: true,
        }),
    },
    sampleData: {},
    async run(ctx) {
        const { auth } = ctx
        const { modelUrl, inputUrl } = ctx.propsValue;

        const outputs = await callClarifaiModel({
          auth,
          modelUrl,
          inputUrl,
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
