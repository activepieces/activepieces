import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { deepgramAuth } from '../common/auth';
import { DEEPGRAM_TIMEOUTS, deepgramClient } from '../common/client';
import { deepgramProjects } from '../common/projects';
import { deepgramProps } from '../common/props';
import { balancesOutputSchema } from '../output-schemas';

export const getBalancesAction = createAction({
  auth: deepgramAuth,
  name: 'get_balances',
  classification: 'READ',
  displayName: 'Get Credit Balance',
  description:
    'Gets the remaining prepaid credit of a Deepgram project. Needs an admin or owner API key.',
  audience: 'human',
  aiMetadata: {
    description:
      'Returns the remaining prepaid credit balances of a Deepgram project, each with its amount and units. Use before large batches to avoid out-of-credit (402) errors. Requires an admin or owner key. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: balancesOutputSchema,
  props: {
    project: deepgramProps.project(),
  },
  async run(context) {
    return listBalances({
      apiKey: context.auth.secret_text,
      input: context.propsValue,
    });
  },
});

export async function listBalances({
  apiKey,
  input,
}: {
  apiKey: string;
  input: ListBalancesInput;
}) {
  const projectId = await deepgramProjects.resolveProjectId({
    apiKey,
    project: input.project,
  });
  const response = await deepgramClient.request<BalancesResponse>({
    apiKey,
    method: HttpMethod.GET,
    path: deepgramProjects.projectPath({ projectId, rest: ['balances'] }),
    timeoutMs: DEEPGRAM_TIMEOUTS.manage,
    operation: 'get the credit balance',
  });
  return {
    balances: (response.body?.balances ?? []).map((balance) =>
      flattenBalance(balance)
    ),
  };
}

export function flattenBalance(balance: BalanceRow) {
  return {
    balance_id: balance.balance_id ?? '',
    amount: typeof balance.amount === 'number' ? balance.amount : null,
    units: balance.units ?? null,
    purchase_order_id: balance.purchase_order_id ?? null,
  };
}

export type BalanceRow = {
  balance_id?: string;
  amount?: number;
  units?: string;
  purchase_order_id?: string;
};

type BalancesResponse = {
  balances?: BalanceRow[];
};

export type ListBalancesInput = {
  project?: string;
};
