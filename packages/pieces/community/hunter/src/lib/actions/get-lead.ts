import {
  createAction,
  Property,
  PiecePropValueSchema,
} from '@activepieces/pieces-framework';
import { hunterAuth } from '../common/auth';
import { validateLeadId } from '../common/props';
import { LeadService } from '../common/lead-service';

export const getLeadAction = createAction({
  name: 'get_lead',
  auth: hunterAuth,
  displayName: 'Get a Lead',
  description: 'Retrieves all the fields of a lead.',
  props: {
    id: Property.Number({
      displayName: 'ID',
      description: 'Identifier of the lead.',
      required: true,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const { id } = propsValue;

    validateLeadId(id);

    const leadService = new LeadService(auth as string);

    try {
      return await leadService.getLead(id);
    } catch (error: any) {
      if (error.message.includes('404')) {
        throw new Error(`Lead with ID ${id} not found`);
      }

      if (error.message.includes('400')) {
        throw new Error('Bad request: Please check your input parameters.');
      }

      if (error.message.includes('403')) {
        throw new Error('Access forbidden: You do not have permission to access this lead.');
      }

      throw new Error(`Failed to get lead: ${error.message}`);
    }
  },
}); 