import { createAction, Property } from '@activepieces/pieces-framework';
import { capsuleCrmAuth } from '../common';
import { makeApiCall, API_ENDPOINTS } from '../common';

export const createProjectAction = createAction({
  auth: capsuleCrmAuth,
  name: 'create_project',
  displayName: 'Create Project',
  description: 'Creates a new project in Capsule CRM.',
  props: {
    name: Property.ShortText({
      displayName: 'Project Name',
      description: 'Name of the project',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Description of the project',
      required: false,
    }),
    partyId: Property.Number({
      displayName: 'Contact ID',
      description: 'ID of the contact associated with this project',
      required: true,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Status of the project',
      required: false,
      defaultValue: 'OPEN',
      options: {
        options: [
          { label: 'Open', value: 'OPEN' },
          { label: 'Closed', value: 'CLOSED' },
        ],
      },
    }),
    expectedCloseOn: Property.ShortText({
      displayName: 'Expected Close Date',
      description: 'Expected close date in YYYY-MM-DD format',
      required: false,
    }),
    ownerId: Property.Number({
      displayName: 'Owner ID',
      description: 'ID of the user who owns this project',
      required: false,
    }),
    teamId: Property.Number({
      displayName: 'Team ID',
      description: 'ID of the team responsible for this project',
      required: false,
    }),
  },
  async run(context) {
    const {
      name,
      description,
      partyId,
      status,
      expectedCloseOn,
      ownerId,
      teamId
    } = context.propsValue;

    // Build the project object (note: API uses 'kase' not 'project')
    const kase: any = {
      name: name,
      party: { id: partyId },
      status: status || 'OPEN',
    };

    if (description) kase.description = description;
    if (expectedCloseOn) kase.expectedCloseOn = expectedCloseOn;
    if (ownerId) kase.owner = { id: ownerId };
    if (teamId) kase.team = { id: teamId };

    const requestBody = { kase };

    const response = await makeApiCall(
      context.auth,
      API_ENDPOINTS.PROJECTS,
      'POST',
      requestBody
    );

    if (response.status >= 200 && response.status < 300) {
      return response.body;
    } else {
      throw new Error(`Failed to create project: ${response.status} ${response.body?.message || ''}`);
    }
  },
});