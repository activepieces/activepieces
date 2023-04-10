import { createAction, Property } from "@activepieces/pieces-framework";
import js2xml from "json2xml";

export const convertJsonToXml = createAction({
    name: 'convert-json-to-xml',
    displayName: "Convert JSON to XML",
    description: "Convert JSON to XML",
    props: {
        json: Property.Json({
            displayName: 'JSON',
            required: true,
        }),
        label: Property.ShortText({
            displayName: 'Label',
            description: 'Label of the data content',
            required: true,
        }),
    },
    async run(context) {
        const { json, label } = context.propsValue;

        const convertedToXml = js2xml({
            [label]: JSON.parse(JSON.stringify(json))
        });

        return convertedToXml;

    },
});