import { createAction, Property } from '@activepieces/pieces-framework';
import { serialize, type FlatResource, type Linkage, type JsonApiResource } from '../common/jsonapi';

export const serializeJsonApiAction = createAction({
  name: 'serialize_jsonapi',
  displayName: 'Serialize JSON:API Request',
  description:
    'Converts a plain object into a JSON:API-compliant request body. ' +
    'Relationship fields are detected automatically - any array or object value is treated as a ' +
    'relationship, only scalars become attributes. ' +
    'The result can be passed directly as the Request Body of the API Call action.',
  auth: undefined,
  props: {
    resourceType: Property.ShortText({
      displayName: 'Resource Type',
      description:
        'The JSON:API resource type (e.g. orders, invoices, products). ' +
        'The _type resolved as resource type automatically.',
      required: false,
    }),
    resourceId: Property.ShortText({
      displayName: 'Resource ID',
      description:
        'ID of the resource - leave empty when creating a new record (POST) ' +
        'or when the input includes id field (the id field is picked up automatically).',
      required: false,
    }),
    attributes: Property.Json({
      displayName: 'Attributes',
      description:
        'The flat object to serialize. Pass the full JSON ' +
        'document here - arrays and objects are automatically placed into ' +
        '"relationships"; only scalar values become attributes. ' +
        'For manual construction use plain key/value pairs, e.g. ' +
        '{"currency":"USD","poNumber":"PO-001"}.',
      required: true,
      defaultValue: {},
    }),
    relationships: Property.Json({
      displayName: 'Relationships (override)',
      description:
        'Optional explicit relationship map that takes priority over any ' +
        'relationships detected inside Attributes. ' +
        'Each key is a relationship name; the value is a single linkage object ' +
        '{"type":"customers","id":"42"}, an array of linkage objects, or null. ' +
        'Example: {"customer":{"type":"customers","id":"42"},' +
        '"lineItems":[{"type":"orderlineitems","id":"1"}]}',
      required: false,
      defaultValue: {},
    }),
    included: Property.Json({
      displayName: 'Included',
      description:
        'Optional array of full JSON:API resource objects to embed in the ' +
        '"included" section of the request. If the input to Attributes already ' +
        'contains an "included" array (e.g. the raw API Call response body) it ' +
        'will be forwarded automatically - this field only needs to be set when ' +
        'adding or overriding included resources manually. Each entry must be a ' +
        'valid JSON:API resource with "type", "id", and "attributes" fields.',
      required: false,
      defaultValue: [],
    }),
  },

  async run(context) {
    const { resourceType, resourceId, attributes, relationships, included } = context.propsValue;

    const flat = (attributes as FlatResource) ?? {};

    // If the caller passed a full JSON:API document that contains an `included`
    // array at the top level, extract and forward it automatically.
    const docIncluded = Array.isArray((flat as Record<string, unknown>)['included'])
      ? ((flat as Record<string, unknown>)['included'] as unknown as JsonApiResource[])
      : [];
    const explicitIncluded = Array.isArray(included)
      ? (included as unknown as JsonApiResource[])
      : [];
    const mergedIncluded = explicitIncluded.length > 0 ? explicitIncluded : docIncluded;

    // Fall back to _type embedded in the flat object (Unserialize action output)
    const resolvedType =
      (resourceType && resourceType.trim() !== '' ? resourceType.trim() : undefined) ??
      (typeof flat['_type'] === 'string' && flat['_type'].trim() !== ''
        ? (flat['_type'] as string).trim()
        : undefined);

    if (!resolvedType) {
      throw new Error(
        'Resource Type is required. Either fill in the "Resource Type" field or ' +
        'pass the output of the Unserialize action (which carries a _type field).'
      );
    }

    return serialize({
      type: resolvedType,
      id: resourceId ?? undefined,
      data: flat,
      relationships: (relationships as Record<string, Linkage | Linkage[] | null>) ?? {},
      included: mergedIncluded,
    });
  },
});
