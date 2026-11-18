import { Property, createAction } from '@activepieces/pieces-framework';
import { dynamicsCRMAuth } from '../../auth';
import { makeClient } from '../../common/client';
import { dynamicsClientInternals } from '../../common/client';
import { LOOKUP_ATTRIBUTE_TYPES } from '../../common/constants';
import { describeEntityOutputSchema } from '../../common/output-schemas';

export const aiDescribeEntityAction = createAction({
  auth: dynamicsCRMAuth,
  name: 'ai_describe_entity',
  classification: 'READ',
  displayName: 'Describe Entity',
  description: 'Describes the columns, option values, lookups and relationships of a table.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns the columns (types, required level, option values), lookup bind keys for @odata.bind and collection relationships of one Dynamics 365 table. Call before creating, updating, filtering or associating records. Read-only.',
    idempotent: true,
  },
  props: {
    entity: Property.ShortText({
      displayName: 'Entity',
      description: 'Logical name (contact) or entity set name (contacts).',
      required: true,
    }),
  },
  outputSchema: describeEntityOutputSchema,
  async run(context) {
    const client = makeClient(context.auth);
    const entity = await client.getEntity(context.propsValue.entity);
    const attributes = await client.listAttributes(entity.LogicalName);
    const options = await client.fetchAllOptionValues(entity.LogicalName);
    const manyToOne = await client.listManyToOne(entity.LogicalName);
    const collections = await client.listCollectionRelationships(entity.LogicalName);
    const setByLogical = new Map((await client.listEntities()).map((item) => [item.LogicalName, item.EntitySetName]));
    const columns = attributes
      .filter((attribute) => !attribute.AttributeOf)
      .map((attribute) => ({
        logicalName: attribute.LogicalName,
        displayName: dynamicsClientInternals.labelText(attribute.DisplayName) ?? attribute.LogicalName,
        type: attribute.AttributeType,
        requiredLevel: attribute.RequiredLevel?.Value ?? 'None',
        validForCreate: attribute.IsValidForCreate === true,
        validForUpdate: attribute.IsValidForUpdate === true,
        filterName: LOOKUP_ATTRIBUTE_TYPES.includes(attribute.AttributeType) ? `_${attribute.LogicalName}_value` : attribute.LogicalName,
        options: options[attribute.LogicalName] ?? [],
      }))
      .sort((a, b) => a.logicalName.localeCompare(b.logicalName));
    const lookups = manyToOne.map((rel) => ({
      attribute: rel.ReferencingAttribute,
      navigationProperty: rel.ReferencingEntityNavigationPropertyName,
      targetEntity: rel.ReferencedEntity,
      targetEntitySet: setByLogical.get(rel.ReferencedEntity) ?? null,
      bindKey: `${rel.ReferencingEntityNavigationPropertyName}@odata.bind`,
    }));
    const collectionRelationships = collections.map((rel) => ({
      ...rel,
      targetEntitySet: setByLogical.get(rel.targetEntity) ?? null,
    }));
    return {
      logicalName: entity.LogicalName,
      entitySet: entity.EntitySetName,
      displayName: dynamicsClientInternals.labelText(entity.DisplayName) ?? entity.LogicalName,
      primaryIdAttribute: entity.PrimaryIdAttribute,
      primaryNameAttribute: entity.PrimaryNameAttribute,
      columns,
      lookups,
      collectionRelationships,
    };
  },
});
