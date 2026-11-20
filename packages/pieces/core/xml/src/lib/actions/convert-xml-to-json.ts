import { createAction, Property } from '@activepieces/pieces-framework';
import { XMLParser } from 'fast-xml-parser';

export const convertXmlToJson = createAction({
  audience: 'both',
  name: 'convert-xml-to-json',
  classification: 'READ',
  displayName: 'Convert XML to JSON',
  description: 'Turn XML text into JSON that later steps can read.',
  aiMetadata: {
    description: 'Parses an XML string into a JSON structure, in either of two modes: keep tag attributes (surfaced as "@_"-prefixed keys) or ignore attributes and keep element text only. Numeric-looking text is converted to numbers unless Keep Leading Zeros is on, in which case zero-prefixed values such as ZIP codes and IDs stay strings. Use it to make an XML payload from an HTTP response, webhook body, or RSS/SOAP feed addressable by later steps; for the opposite direction use Create XML, which accepts this output as-is. Requires a well-formed XML string passed as text, and the XML declaration is always dropped; read-only and idempotent.',
    idempotent: true,
  },
  props: {
    xml: Property.LongText({
      displayName: 'XML',
      description: 'The XML text to convert, such as an HTTP response body.',
      placeholder: '<order id="42"><total>9.99</total></order>',
      required: true,
    }),
    ignoreAttributes: Property.Checkbox({
      displayName: 'Ignore Attributes',
      description: 'Drop tag attributes. When off, id="42" becomes "@_id": "42".',
      required: false,
      defaultValue: false,
    }),
    keepLeadingZeros: Property.Checkbox({
      displayName: 'Keep Leading Zeros',
      description: 'Keep values like "02134" as text instead of turning them into 2134.',
      required: false,
      defaultValue: true,
    }),
  },
  async run(context) {
    const { xml, ignoreAttributes, keepLeadingZeros } = context.propsValue;
    const parser = new XMLParser({
      ignoreAttributes: ignoreAttributes ?? false,
      ignoreDeclaration: true,
      ...((keepLeadingZeros ?? false) ? { numberParseOptions: { hex: true, leadingZeros: false, eNotation: true } } : {}),
    });
    return parser.parse(xml);
  },
});
