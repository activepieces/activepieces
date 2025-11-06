import {
  createAction,
  Property,
  DynamicPropsValue,
} from '@activepieces/pieces-framework';
import { capsuleCrmAuth, CapsuleCrmAuthType } from '../common/auth';
import { capsuleCrmClient } from '../common/client';
import { CreateEntryParams } from '../common/types';

export const addNoteToEntityAction = createAction({
  auth: capsuleCrmAuth,
  name: 'add_note_to_entity',
  displayName: 'Add Note to Entity',
  description:
    'Add a comment/note to an entity (e.g., contact, opportunity, project).',
  props: {
    content: Property.LongText({
      displayName: 'Note Content',
      description: 'The body of the note.',
      required: true,
    }),
    entityType: Property.StaticDropdown({
      displayName: 'Entity Type',
      description: 'The type of entity to add the note to.',
      required: true,
      options: {
        options: [
          { label: 'Party (Contact)', value: 'party' },
          { label: 'Opportunity', value: 'opportunity' },
          { label: 'Project', value: 'project' },
        ],
      },
    }),
    entityId: Property.DynamicProperties({
      displayName: 'Entity',
      required: true,
      refreshers: ['entityType'],
      props: async ({ auth, entityType }) => {
        const fields: DynamicPropsValue = {};
        const entityTypeStr = entityType as unknown as string;
        if (!auth || !entityTypeStr) return fields;

        if (entityTypeStr === 'party') {
          fields['partyId'] = Property.Dropdown({
            displayName: 'Party',
            required: true,
            refreshers: [],
            options: async () => {
              if (!auth)
                return {
                  options: [],
                  disabled: true,
                  placeholder: 'Please connect your Capsule CRM account first',
                };
              const contacts = await capsuleCrmClient.searchContacts(
                auth as CapsuleCrmAuthType,
                ''
              );
              return {
                options: contacts.map((contact) => ({
                  label:
                    contact.type === 'person'
                      ? `${contact.firstName} ${contact.lastName}`
                      : contact.name || `Unnamed ${contact.type}`,
                  value: contact.id,
                })),
              };
            },
          });
        } else if (entityTypeStr === 'opportunity') {
          fields['opportunityId'] = Property.Dropdown({
            displayName: 'Opportunity',
            required: true,
            refreshers: [],
            options: async () => {
              if (!auth)
                return {
                  options: [],
                  disabled: true,
                  placeholder: 'Please connect your Capsule CRM account first',
                };
              const opportunities =
                await capsuleCrmClient.searchOpportunities(
                  auth as CapsuleCrmAuthType
                );
              return {
                options: opportunities.map((opportunity) => ({
                  label: opportunity.name,
                  value: opportunity.id,
                })),
              };
            },
          });
        } else if (entityTypeStr === 'project') {
          fields['projectId'] = Property.Dropdown({
            displayName: 'Project',
            required: true,
            refreshers: [],
            options: async () => {
              if (!auth)
                return {
                  options: [],
                  disabled: true,
                  placeholder: 'Please connect your Capsule CRM account first',
                };
              const projects = await capsuleCrmClient.searchProjects(
                auth as CapsuleCrmAuthType
              );
              return {
                options: projects.map((project) => ({
                  label: project.name,
                  value: project.id,
                })),
              };
            },
          });
        }
        return fields;
      },
    }),
    activityTypeId: Property.Dropdown({
      displayName: 'Activity Type',
      description: 'The activity type for this entry. Defaults to "Note".',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth)
          return {
            options: [],
            disabled: true,
            placeholder: 'Please connect your Capsule CRM account first',
          };
        const activityTypes = await capsuleCrmClient.listActivityTypes(
          auth as CapsuleCrmAuthType
        );
        return {
          options: activityTypes.map((activityType) => ({
            label: activityType.name,
            value: activityType.id,
          })),
        };
      },
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;

    const entryData: CreateEntryParams = {
      type: 'note',
      content: propsValue.content,
    };

    if (propsValue.activityTypeId) {
      entryData.activityType = { id: propsValue.activityTypeId };
    }

    const entityId = propsValue.entityId as DynamicPropsValue;
    if (entityId) {
      if (entityId['partyId']) {
        entryData.party = { id: entityId['partyId'] as number };
      } else if (entityId['opportunityId']) {
        entryData.opportunity = { id: entityId['opportunityId'] as number };
      } else if (entityId['projectId']) {
        entryData.kase = { id: entityId['projectId'] as number };
      }
    }

    return await capsuleCrmClient.createEntry(auth, entryData);
  },
});
