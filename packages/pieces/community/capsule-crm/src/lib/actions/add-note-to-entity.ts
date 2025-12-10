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
      auth: capsuleCrmAuth,
      displayName: 'Entity',
      required: true,
      refreshers: ['entityType'],
      props: async ({ auth, entityType }) => {
        const fields: DynamicPropsValue = {};
        const entityTypeStr = entityType as unknown as string;
        if (!auth || !entityTypeStr) return fields;

        if (entityTypeStr === 'party') {
          const contacts = await capsuleCrmClient.searchContacts(
            auth,
            ''
          );
          fields['partyId'] = Property.StaticDropdown({
            displayName: 'Party',
            required: true,
            options:{
              options: contacts.map((contact) => ({
                label:
                  contact.type === 'person'
                    ? `${contact.firstName} ${contact.lastName}`
                    : contact.name || `Unnamed ${contact.type}`,
                value: contact.id,
              })),
            }})
        } else if (entityTypeStr === 'opportunity') {
          const opportunities =
          await capsuleCrmClient.searchOpportunities(
            auth
          );
          fields['opportunityId'] = Property.StaticDropdown({
            displayName: 'Opportunity',
            required: true,
            options: {
              options: opportunities.map((opportunity) => ({
                label: opportunity.name,
                value: opportunity.id,
              })),
            }})
        } else if (entityTypeStr === 'project') {
          const projects = await capsuleCrmClient.searchProjects(
            auth
          );
          fields['projectId'] = Property.StaticDropdown({
            displayName: 'Project',
            required: true,
            options:{
              options: projects.map((project) => ({
                label: project.name,
                value: project.id,
              })),
            }})
        }
        return fields;
      },
    }),
    activityTypeId: Property.Dropdown({
      displayName: 'Activity Type',
      description: 'The activity type for this entry. Defaults to "Note".',
      required: false,
      refreshers: [],
      auth: capsuleCrmAuth,
      options: async ({ auth }) => {
        if (!auth)
          return {
            options: [],
            disabled: true,
            placeholder: 'Please connect your Capsule CRM account first',
          };
        const activityTypes = await capsuleCrmClient.listActivityTypes(
          auth
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
