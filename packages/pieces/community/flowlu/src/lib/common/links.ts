import { FlowluApiError, FlowluClient } from './client';

async function linkAccountToLead({
  client,
  leadId,
  accountId,
  accountType,
}: {
  client: FlowluClient;
  leadId: number;
  accountId: number;
  accountType: 1 | 2;
}): Promise<LinkResult> {
  const existing = await client.list<Record<string, unknown>>(
    'crm',
    'lead_accounts',
    {
      'filter[lead_id]': leadId,
      'filter[account_id]': accountId,
      limit: 1,
    }
  );
  const match = existing.items.find(
    (item) =>
      Number(item['lead_id']) === leadId &&
      Number(item['account_id']) === accountId
  );
  if (match) {
    return { ...match, already_linked: true };
  }
  const created = await client.createRecord<Record<string, unknown>>(
    'crm',
    'lead_accounts',
    {
      lead_id: leadId,
      account_id: accountId,
      account_type: accountType,
    }
  );
  return {
    ...created,
    lead_id: leadId,
    account_id: accountId,
    account_type: accountType,
    already_linked: false,
  };
}

async function linkAccountsReported({
  client,
  leadId,
  links,
}: {
  client: FlowluClient;
  leadId: number;
  links: { accountId: number; accountType: 1 | 2 }[];
}): Promise<{
  linked_accounts: LinkResult[];
  link_errors: { account_id: number; error: string }[];
}> {
  const linked: LinkResult[] = [];
  const errors: { account_id: number; error: string }[] = [];
  for (const link of links) {
    try {
      linked.push(await linkAccountToLead({ client, leadId, ...link }));
    } catch (error) {
      if (!(error instanceof FlowluApiError)) {
        throw error;
      }
      errors.push({ account_id: link.accountId, error: error.message });
    }
  }
  return { linked_accounts: linked, link_errors: errors };
}

async function linkLegacyCustomer({
  client,
  leadId,
  customerId,
  contactId,
}: {
  client: FlowluClient;
  leadId: number;
  customerId: number | undefined;
  contactId: number | undefined;
}): Promise<
  | {
      linked_accounts: LinkResult[];
      link_errors: { account_id: number; error: string }[];
    }
  | undefined
> {
  if (customerId === undefined && contactId === undefined) {
    return undefined;
  }
  const lookupErrors: { account_id: number; error: string }[] = [];
  const links: { accountId: number; accountType: 1 | 2 }[] = [];
  if (customerId !== undefined) {
    try {
      const account = await client.getRecord<Record<string, unknown>>(
        'crm',
        'account',
        customerId
      );
      links.push({
        accountId: customerId,
        accountType: Number(account['type']) === 2 ? 2 : 1,
      });
    } catch (error) {
      if (!(error instanceof FlowluApiError)) {
        throw error;
      }
      lookupErrors.push({ account_id: customerId, error: error.message });
    }
  }
  if (contactId !== undefined && contactId !== customerId) {
    links.push({ accountId: contactId, accountType: 2 });
  }
  const result = await linkAccountsReported({ client, leadId, links });
  return {
    linked_accounts: result.linked_accounts,
    link_errors: [...lookupErrors, ...result.link_errors],
  };
}

export const flowluLinks = {
  linkAccountToLead,
  linkAccountsReported,
  linkLegacyCustomer,
};

type LinkResult = Record<string, unknown> & { already_linked: boolean };
