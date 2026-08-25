import { createAction, Property } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';
import { pipelineDropdown } from '../common/dropdowns';

export const getDealAction = createAction({
  name: 'get_deal',
  auth: outsetaAuth,
  displayName: 'Retrieve Deal',
  description:
    'Retrieve a deal by its UID, or by the email of the contact associated with the deal plus the pipeline.',
  audience: 'both',
  aiMetadata: {
    description:
      'Fetches a single Outseta CRM deal by its UID, or by the contact email plus pipeline, returning amount, due date, pipeline stage, and the associated account. Use to read a deal by either identifier. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    lookupBy: Property.StaticDropdown({
      displayName: 'Lookup by',
      description: 'How to find the deal to retrieve.',
      required: true,
      defaultValue: 'uid',
      options: {
        disabled: false,
        options: [
          { label: 'Deal UID', value: 'uid' },
          { label: 'Contact email + pipeline', value: 'email' },
        ],
      },
    }),
    dealUid: Property.ShortText({
      displayName: 'Deal UID',
      description: 'Used when "Lookup by" is set to Deal UID.',
      required: false,
    }),
    contactEmail: Property.ShortText({
      displayName: 'Contact Email',
      description: 'Used when "Lookup by" is set to Contact email + pipeline.',
      required: false,
    }),
    pipelineUid: pipelineDropdown({
      required: false,
      description:
        'Used when "Lookup by" is set to Contact email + pipeline. Required in that mode.',
    }),
  },
  async run(context) {
    const client = new OutsetaClient({
      domain: context.auth.props.domain,
      apiKey: context.auth.props.apiKey,
      apiSecret: context.auth.props.apiSecret,
    });

    let match: any;

    if (context.propsValue.lookupBy === 'uid') {
      const uid = context.propsValue.dealUid;
      if (!uid) {
        throw new Error('Deal UID is required when looking up by UID.');
      }
      match = await client.get<any>(
        `/api/v1/crm/deals/${uid}?fields=Uid,Name,Amount,DueDate,Created,Updated,AssignedToPersonClientIdentifier,DealPipelineStage.Uid,DealPipelineStage.Name,DealPipelineStage.DealPipeline.Uid,DealPeople.Person.Uid,DealPeople.Person.Email,Account.Uid,Account.Name`
      );
    } else {
      const contactEmail = context.propsValue.contactEmail?.toLowerCase();
      const pipelineUid = context.propsValue.pipelineUid;
      if (!contactEmail || !pipelineUid) {
        throw new Error(
          'Contact email and pipeline are both required when looking up by email + pipeline.'
        );
      }
      // Outseta supports server-side nested filters on /crm/deals — confirmed
      // by Outseta support. A non-existent pipeline UID returns 400 "Invalid
      // filter specification"; a real but unmatched UID returns an empty list.
      const items = await client.getAllPages<any>(
        `/api/v1/crm/deals?DealPipelineStage.DealPipeline.Uid=${encodeURIComponent(pipelineUid)}&fields=Uid,Name,Amount,DueDate,Created,Updated,AssignedToPersonClientIdentifier,DealPipelineStage.Uid,DealPipelineStage.Name,DealPipelineStage.DealPipeline.Uid,DealPeople.Person.Uid,DealPeople.Person.Email,Account.Uid,Account.Name`
      );
      match = items.find((deal: any) => {
        const dealPeople: any[] =
          deal.DealPeople?.items ?? deal.DealPeople?.Items ?? deal.DealPeople ?? [];
        const hasContact = dealPeople.some(
          (dp: any) => dp.Person?.Email?.toLowerCase() === contactEmail
        );
        const inPipeline =
          deal.DealPipelineStage?.DealPipeline?.Uid === pipelineUid;
        return hasContact && inPipeline;
      });
      if (!match) {
        throw new Error(
          `No deal found for contact "${context.propsValue.contactEmail}" in the selected pipeline.`
        );
      }
    }

    return {
      uid: match.Uid ?? null,
      name: match.Name ?? null,
      amount: match.Amount ?? null,
      due_date: match.DueDate ?? null,
      pipeline_stage_uid: match.DealPipelineStage?.Uid ?? null,
      pipeline_stage_name: match.DealPipelineStage?.Name ?? null,
      account_uid: match.Account?.Uid ?? null,
      account_name: match.Account?.Name ?? null,
      assigned_to_client_identifier: match.AssignedToPersonClientIdentifier ?? null,
      created: match.Created ?? null,
      updated: match.Updated ?? null,
    };
  },
});
