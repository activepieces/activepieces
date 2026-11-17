import { Property, createAction } from '@activepieces/pieces-framework';
import { dynamicsCRMAuth } from '../../auth';
import { makeClient } from '../../common/client';
import { odata } from '../../common/odata';
import { dynamicsClientInternals } from '../../common/client';
import { listEntitiesOutputSchema } from '../../common/output-schemas';

export const aiListEntitiesAction = createAction({
  auth: dynamicsCRMAuth,
  name: 'ai_list_entities',
  classification: 'READ',
  displayName: 'List Entities',
  description: 'Lists the tables (entities) in the environment with their entity set names.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists Dynamics 365 / Dataverse tables with their logicalName and entitySet. Call this first to find the entitySet that the other tools take, then Describe Entity for its columns. Read-only.',
    idempotent: true,
  },
  props: {
    nameContains: Property.ShortText({
      displayName: 'Name Contains',
      description: 'Optional text to match in the logical name, entity set or display name, for example invoice.',
      required: false,
    }),
    customizableOnly: Property.StaticDropdown<string>({
      displayName: 'Customizable Only',
      description: 'yes (default) hides internal system tables.',
      required: false,
      defaultValue: 'yes',
      options: { disabled: false, options: [{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }] },
    }),
  },
  outputSchema: listEntitiesOutputSchema,
  async run(context) {
    const { nameContains, customizableOnly } = context.propsValue;
    const needle = (nameContains ?? '').trim().toLowerCase();
    const onlyCustomizable = odata.readYesNo({ value: customizableOnly, fallback: true });
    const entities = (await makeClient(context.auth).listEntities())
      .filter((entity) => !onlyCustomizable || entity.IsCustomizable?.Value === true)
      .map((entity) => ({
        logicalName: entity.LogicalName,
        entitySet: entity.EntitySetName,
        displayName: dynamicsClientInternals.labelText(entity.DisplayName) ?? entity.LogicalName,
        primaryIdAttribute: entity.PrimaryIdAttribute,
        primaryNameAttribute: entity.PrimaryNameAttribute,
      }))
      .filter((entity) => needle === '' || [entity.logicalName, entity.entitySet ?? '', entity.displayName].some((text) => text.toLowerCase().includes(needle)));
    return { count: entities.length, entities };
  },
});
