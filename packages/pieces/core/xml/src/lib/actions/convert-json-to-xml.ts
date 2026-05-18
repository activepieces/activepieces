import { createAction, Property } from '@activepieces/pieces-framework';
import js2xml from 'json2xml';

export const convertJsonToXml = createAction({
  name: 'convert-json-to-xml',
  displayName: 'Convert JSON to XML',
  description: 'Convert JSON to XML',
  props: {
    json: Property.Json({
      displayName: 'JSON',
      required: true,
    }),
    attributes_key: Property.ShortText({
      displayName: 'Attribute field',
      description: "Field to add your tag's attributes",
      required: false,
    }),
    header: Property.Checkbox({
      displayName: 'Header',
      description: 'Add XML header',
      required: false,
    }),
  },
  async run(context) {
    const { json } = context.propsValue;

    const attributes_key = context.propsValue.attributes_key
      ? context.propsValue.attributes_key
      : 'attr';
    const header = context.propsValue.header
      ? context.propsValue.header
      : false;

    return js2xml(JSON.parse(JSON.stringify(json)), { attributes_key, header });
  },
});
