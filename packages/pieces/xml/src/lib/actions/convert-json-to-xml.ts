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
        })
    },
    async run(context) {
        return js2xml(JSON.parse(JSON.stringify(context.propsValue.json)));

    },
});