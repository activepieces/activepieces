import { createAction, Property } from '@activepieces/pieces-framework';
import { XMLParser } from 'fast-xml-parser';

export const convertXmlToJson = createAction({
  name: 'convert-xml-to-json',
  displayName: 'Convert XML to JSON',
  description: 'Convert XML to JSON',
  props: {
    xml: Property.LongText({
      displayName: 'XML',
      description: 'The XML string to convert',
      required: true,
    }),
    ignoreAttributes: Property.Checkbox({
      displayName: 'Ignore Attributes',
      description: 'Ignore XML tag attributes during parsing',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { xml, ignoreAttributes } = context.propsValue;
    const parser = new XMLParser({ ignoreAttributes: ignoreAttributes ?? false, ignoreDeclaration: true });
    return parser.parse(xml);
  },
});
