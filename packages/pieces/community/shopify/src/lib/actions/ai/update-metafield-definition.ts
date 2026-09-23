import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlJob,
  GqlMetafieldDefinition,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyProps,
  shopifyValues,
} from '../../common/graphql';

export const shopifyAiUpdateMetafieldDefinition = createAction({
  auth: shopifyAuth,
  name: 'update_metafield_definition',
  classification: 'WRITE',
  displayName: 'Update Metafield Definition',
  description: 'Change a metafield definition\'s name, description or validation rules.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Updates one metafield definition, identified by owner type, namespace and key (these and the type cannot be changed). Only the fields you supply are sent; at least one is required. Sending validations REPLACES the whole validation list, so read the current list with get_metafield_definition and send every rule you want to keep; remove_all_validations Yes clears them. Changing validations makes Shopify re-check existing values in the background (validation_job_id, poll with get_job) and values that break the new rules become invalid. Repeating the same update leaves the same state. Needs the write access scope of the owner type (for example write_products).',
    idempotent: true,
  },
  props: {
    owner_type: shopifyProps.metafieldOwnerType({
      required: true,
      description: 'The resource type of the definition, for example PRODUCT.',
    }),
    namespace: Property.ShortText({
      displayName: 'Namespace',
      description: 'The definition namespace, for example "custom".',
      required: true,
    }),
    key: Property.ShortText({
      displayName: 'Key',
      description: 'The definition key, for example "care_instructions".',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'New display name, for example "Care instructions".',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'New description shown to staff.',
      required: false,
    }),
    validations: Property.Array({
      displayName: 'Validations',
      description:
        'The complete new list of validation rules; replaces every existing rule. Leave empty to keep the current rules.',
      required: false,
      properties: {
        name: Property.ShortText({
          displayName: 'Rule Name',
          description: 'Validation name supported by the type, for example "min", "max", "regex" or "choices".',
          required: true,
        }),
        value: Property.ShortText({
          displayName: 'Rule Value',
          description: 'Rule value as a string, for example "1", "100" or "[\\"S\\",\\"M\\",\\"L\\"]" for choices.',
          required: true,
        }),
      },
    }),
    remove_all_validations: shopifyProps.booleanChoice({
      displayName: 'Remove All Validations',
      description: 'Yes removes every validation rule. Cannot be combined with validations.',
    }),
  },
  async run({ auth, propsValue }) {
    const namespace = shopifyValues.nonEmpty(propsValue.namespace);
    const key = shopifyValues.nonEmpty(propsValue.key);
    if (!propsValue.owner_type || !namespace || !key) {
      throw new Error('owner_type, namespace and key are all required. Nothing was changed.');
    }
    const validations = readValidations(propsValue.validations);
    const clearValidations = shopifyValues.toBooleanChoice(propsValue.remove_all_validations) === true;
    if (clearValidations && validations) {
      throw new Error('Send either validations or remove_all_validations, not both. Nothing was changed.');
    }
    const changes = shopifyValues.compact({
      name: shopifyValues.nonEmpty(propsValue.name),
      description: shopifyValues.nonEmpty(propsValue.description),
      validations: clearValidations ? [] : validations,
    });
    if (Object.keys(changes).length === 0) {
      throw new Error('Nothing to update: provide a name, description or validations. Nothing was changed.');
    }
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      metafieldDefinitionUpdate: {
        updatedDefinition?: GqlMetafieldDefinition | null;
        validationJob?: GqlJob | null;
      } | null;
    }>({
      auth,
      query: `mutation UpdateMetafieldDefinition($definition: MetafieldDefinitionUpdateInput!) { metafieldDefinitionUpdate(definition: $definition) { updatedDefinition { ${shopifyFields.METAFIELD_DEFINITION_FIELDS} } validationJob { id done } userErrors { field message code } } }`,
      variables: { definition: { ownerType: propsValue.owner_type, namespace, key, ...changes } },
    });
    const updated = data.metafieldDefinitionUpdate?.updatedDefinition;
    if (!updated) {
      throw new Error('Shopify did not return the updated metafield definition.');
    }
    return {
      ...shopifyMappers.mapMetafieldDefinition(updated),
      validation_job_id: data.metafieldDefinitionUpdate?.validationJob?.id ?? null,
      validation_job_done: data.metafieldDefinitionUpdate?.validationJob?.done ?? null,
      redacted_fields: redactedFields,
    };
  },
});

function readValidations(value: unknown): { name: string; value: string }[] | undefined {
  const rows = shopifyValues.readRecords(value);
  if (rows.length === 0) {
    return undefined;
  }
  return rows.map((row, index) => {
    const name = shopifyValues.readText(row['name']);
    const ruleValue = shopifyValues.readText(row['value']);
    if (!name || ruleValue === undefined) {
      throw new Error(`validations[${index}] needs a name and a value. Nothing was changed.`);
    }
    return { name, value: ruleValue };
  });
}
