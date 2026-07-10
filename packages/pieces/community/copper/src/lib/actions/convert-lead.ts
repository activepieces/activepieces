import { createAction, Property } from '@activepieces/pieces-framework';
import { CopperAuth } from '../common/constants';
import {
  companyDropdown,
  leadDropdown,
  opportunityDropdown,
} from '../common/props';
import { CopperApiService } from '../common/requests';

export const convertLead = createAction({
  auth: CopperAuth,
  name: 'convertLead',
  displayName: 'Convert Lead',
  description:
    'Converts a lead into a person (optionally with company/opportunity).',
  audience: 'both',
  aiMetadata: {
    description:
      'Converts a qualified lead in Copper CRM into a person, optionally linking it to an existing company and/or creating an opportunity from the selected opportunity template. Use once a lead is ready to be promoted into the contact/deal pipeline; requires the lead ID. Not idempotent: it consumes the lead and creates new records, so repeating it is not safe.',
    idempotent: false,
  },
  props: {
    leadId: leadDropdown(['auth']),
    companyId: companyDropdown({ refreshers: ['auth'] }),
    opportunityId: opportunityDropdown({ refreshers: ['auth'] }),
  },
  async run(context) {
    const { leadId, companyId, opportunityId } = context.propsValue;

    const opportunity = opportunityId
      ? JSON.parse(opportunityId as string)
      : null;
    const company = companyId ? JSON.parse(companyId as string) : null;
    const lead = JSON.parse(leadId as string);

    const payload = {
      person: {
        name: lead.name,
      },
      company: {
        ...(company
          ? {
              id: company.id,
            }
          : {
              name: '',
            }),
      },
      ...(opportunity
        ? {
            opportunity: {
              name: opportunity.name,
              pipeline_id: opportunity.pipeline_id,
              pipeline_stage_id: opportunity.pipeline_stage_id,
              monetary_value: opportunity.monetary_value || undefined,
              assignee_id: opportunity.assignee_id,
            },
          }
        : {}),
    };

    return await CopperApiService.convertLead(context.auth, lead.id, {
      details: payload,
    });
  },
});
