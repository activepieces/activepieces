import { createAction, Property } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';
import { pipelineDropdown } from '../common/dropdowns';

export const getDealAction = createAction({
  name: 'get_deal',
  auth: outsetaAuth,
  displayName: 'Retrieve Deal',
  description: 'Retrieve a deal by contact email and pipeline.',
  props: {
    contactEmail: Property.ShortText({
      displayName: 'Contact Email',
      description: 'The email address of the contact associated with the deal.',
      required: true,
    }),
    pipelineUid: pipelineDropdown(),
  },
  async run(context) {
    const client = new OutsetaClient({
      domain: context.auth.props.domain,
      apiKey: context.auth.props.apiKey,
      apiSecret: context.auth.props.apiSecret,
    });

    const contactEmail = context.propsValue.contactEmail.toLowerCase();
    const pipelineUid = context.propsValue.pipelineUid;

    // Outseta does not support nested filters on /crm/deals (DealPipelineStage.*
    // returns "Invalid filter specification"), so fetch all deals with the
    // pipeline expanded and filter client-side on pipelineUid.
    const items = await client.getAllPages<any>(
      `/api/v1/crm/deals?fields=Uid,Name,Amount,DueDate,Created,Updated,AssignedToPersonClientIdentifier,DealPipelineStage.Uid,DealPipelineStage.Name,DealPipelineStage.DealPipeline.Uid,DealPeople.Person.Uid,DealPeople.Person.Email,Account.Uid,Account.Name`
    );

    const match = items.find((deal: any) => {
      const dealPeople: any[] = deal.DealPeople?.items
        ?? deal.DealPeople?.Items
        ?? deal.DealPeople
        ?? [];
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
