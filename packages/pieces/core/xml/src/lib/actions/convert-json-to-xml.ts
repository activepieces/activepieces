import { createAction, Property } from '@activepieces/pieces-framework';
import js2xml from 'json2xml';

export const convertJsonToXml = createAction({
  audience: 'both',
  name: 'convert-json-to-xml',
  classification: 'READ',
  displayName: 'Convert JSON to XML',
  description: 'Convert JSON to XML',
  aiMetadata: {
    description: 'Serializes a JSON object or array into an XML string, optionally prepending an XML declaration header and rendering the values under one designated key as tag attributes instead of child elements. Prefer Create XML for new work: this action merges list items into one element and does not read the "@_" attribute keys or "#text" that Convert XML to JSON returns. For the opposite direction use Convert XML to JSON. Requires valid JSON input, and attributes are only emitted for the nested key named by the attribute field (defaults to "attr"); deterministic and idempotent.',
    idempotent: true,
  },
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
