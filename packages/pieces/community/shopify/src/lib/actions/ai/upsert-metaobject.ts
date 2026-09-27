import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlMetaobject,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyValues,
} from '../../common/graphql';
import { metaobjectOutputSchema } from '../../output-schemas/content';

export const shopifyAiUpsertMetaobject = createAction({
  auth: shopifyAuth,
  name: 'upsert_metaobject',
  classification: 'WRITE',
  displayName: 'Create or Update Metaobject Entry',
  description: 'Create a metaobject entry, or update the fields you send on an existing one, by type and handle.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates or updates one metaobject entry keyed by type + handle: when no entry of that type has the handle it is created, otherwise it is updated. Only the fields you send are written; every other field keeps its current value (a patch, never a full replacement), so send just the keys you want to change. Field keys come from the type\'s definition (list_metaobject_definitions); values are strings, with lists and references as JSON strings. status (DRAFT or ACTIVE) and template_suffix are sent only when you set them; they apply only to types with the publishable or online store capability, and a new entry otherwise gets Shopify\'s default status. Sending the same values again leaves the same state. Needs the write_metaobjects access scope.',
    idempotent: true,
  },
  outputSchema: metaobjectOutputSchema,
  props: {
    type: Property.ShortText({
      displayName: 'Metaobject Type',
      description: 'The metaobject definition type, for example "designer". Find it with list_metaobject_definitions.',
      required: true,
    }),
    handle: Property.ShortText({
      displayName: 'Handle',
      description: 'Unique handle of the entry within its type, for example "ada-lovelace". Reusing an existing handle updates that entry.',
      required: true,
    }),
    fields: Property.Array({
      displayName: 'Fields',
      description: 'Field values to write; fields you leave out keep their current values.',
      required: false,
      properties: {
        key: Property.ShortText({
          displayName: 'Field Key',
          description: 'Field key from the definition, for example "name" or "country".',
          required: true,
        }),
        value: Property.LongText({
          displayName: 'Value',
          description: 'Field value as a string, for example "Ada Lovelace", "42" or "[\\"gid://shopify/Product/1\\"]" for a list of references.',
          required: true,
        }),
      },
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'DRAFT hides the entry from the storefront, ACTIVE shows it. Only for publishable types; leave empty to keep the current status.',
      required: false,
      options: {
        options: [
          { label: 'Draft', value: 'DRAFT' },
          { label: 'Active', value: 'ACTIVE' },
        ],
      },
    }),
    template_suffix: Property.ShortText({
      displayName: 'Template Suffix',
      description: 'Online store template suffix for the entry\'s page. Only for types with the online store capability.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const type = shopifyValues.nonEmpty(propsValue.type);
    const handle = shopifyValues.nonEmpty(propsValue.handle);
    if (!type || !handle) {
      throw new Error('A metaobject type and handle are required. Nothing was changed.');
    }
    const fields = readFields(propsValue.fields);
    const templateSuffix = shopifyValues.nonEmpty(propsValue.template_suffix);
    const capabilities = shopifyValues.compact({
      publishable: propsValue.status ? { status: propsValue.status } : undefined,
      onlineStore: templateSuffix ? { templateSuffix } : undefined,
    });
    const metaobject = shopifyValues.compact({
      fields: fields.length > 0 ? fields : undefined,
      capabilities: Object.keys(capabilities).length > 0 ? capabilities : undefined,
    });
    if (Object.keys(metaobject).length === 0) {
      throw new Error('Nothing to write: provide at least one field, a status or a template_suffix. Nothing was changed.');
    }
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      metaobjectUpsert: { metaobject: GqlMetaobject | null } | null;
    }>({
      auth,
      query: `mutation UpsertMetaobject($handle: MetaobjectHandleInput!, $metaobject: MetaobjectUpsertInput!) { metaobjectUpsert(handle: $handle, metaobject: $metaobject) { metaobject { ${shopifyFields.METAOBJECT_FIELDS} } userErrors { field message code elementKey elementIndex } } }`,
      variables: { handle: { type, handle }, metaobject },
    });
    const saved = data.metaobjectUpsert?.metaobject;
    if (!saved) {
      throw new Error('Shopify did not return the metaobject entry.');
    }
    return {
      ...shopifyMappers.mapMetaobject(saved),
      redacted_fields: redactedFields,
    };
  },
});

function readFields(value: unknown): { key: string; value: string }[] {
  const rows = shopifyValues.readRecords(value);
  const fields = rows.map((row, index) => {
    const key = shopifyValues.readText(row['key']);
    const content = row['value'];
    if (!key || content === undefined || content === null) {
      throw new Error(`fields[${index}] needs a key and a value. Nothing was changed.`);
    }
    return { key, value: typeof content === 'string' ? content : JSON.stringify(content) };
  });
  const keys = fields.map((field) => field.key);
  const duplicate = keys.find((key, index) => keys.indexOf(key) !== index);
  if (duplicate) {
    throw new Error(`Field "${duplicate}" is listed more than once; send each key once. Nothing was changed.`);
  }
  return fields;
}
