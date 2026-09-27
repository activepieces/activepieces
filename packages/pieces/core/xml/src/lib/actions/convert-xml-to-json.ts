import { createAction, Property } from '@activepieces/pieces-framework';
import { XMLParser } from 'fast-xml-parser';

export const convertXmlToJson = createAction({
  audience: 'both',
  name: 'convert-xml-to-json',
  classification: 'READ',
  displayName: 'Convert XML to JSON',
  description: 'Convert XML to JSON',
  aiMetadata: {
    description: 'Parses an XML string into a JSON structure, in either of two modes: keep tag attributes (surfaced as "@_"-prefixed keys) or ignore attributes and keep element text only. Numeric-looking text is converted to numbers unless Keep Leading Zeros is on, in which case zero-prefixed values such as ZIP codes and IDs stay strings. Use it to make an XML payload from an HTTP response, webhook body, or RSS/SOAP feed addressable by later steps; for the opposite direction use Convert JSON to XML. Requires a well-formed XML string passed as text, and the XML declaration is always dropped; read-only and idempotent.',
    idempotent: true,
  },
  props: {
    xml: Property.LongText({
      displayName: 'XML',
      description: 'The XML string to convert',
      required: true,
    }),
    ignoreAttributes: Property.Checkbox({
      displayName: 'Ignore Attributes',
      description: 'Ignore XML tag attributes during parsing. When unchecked, attributes are included in the output with a "@_" prefix (e.g. id="42" becomes {"@_id": "42"}).',
      required: false,
      defaultValue: false,
    }),
    keepLeadingZeros: Property.Checkbox({
      displayName: 'Keep Leading Zeros',
      description: 'Keep numbers that start with a zero as text so values like ZIP codes, IDs and account numbers are not changed (e.g. "02134" stays "02134" instead of becoming 2134). Other numbers are still converted to numbers.',
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
