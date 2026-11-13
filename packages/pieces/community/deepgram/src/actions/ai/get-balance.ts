import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { deepgramAuth } from '../../common/auth';
import { balanceOutputSchema } from '../../output-schemas';
import { DEEPGRAM_TIMEOUTS, deepgramClient } from '../../common/client';
import { deepgramProjects } from '../../common/projects';
import { deepgramProps } from '../../common/props';
import { BalanceRow, flattenBalance } from '../get-balances';

export const getBalanceAction = createAction({
  auth: deepgramAuth,
  name: 'deepgram_get_balance',
  classification: 'READ',
  displayName: 'Get Credit Balance by ID',
  description: 'Gets one prepaid credit balance of a Deepgram project by ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one prepaid credit balance of a Deepgram project by its balance ID, with amount and units. Get the ID from deepgram_list_balances, which already returns every balance. Needs an admin or owner key. Read-only.',
    idempotent: true,
  },
  outputSchema: balanceOutputSchema,
  props: {
    project_id: deepgramProps.projectId(),
    balance_id: Property.ShortText({
      displayName: 'Balance ID',
      description: 'The balance ID from deepgram_list_balances.',
      required: true,
    }),
  },
  async run(context) {
    const apiKey = context.auth.secret_text;
    const balanceId = (context.propsValue.balance_id ?? '').trim();
    if (balanceId.length === 0) {
      throw new Error('Enter a balance ID.');
    }
    const projectId = await deepgramProjects.resolveProjectId({
      apiKey,
      project: context.propsValue.project_id,
    });
    const response = await deepgramClient.request<BalanceRow>({
      apiKey,
      method: HttpMethod.GET,
      path: deepgramProjects.projectPath({
        projectId,
        rest: ['balances', balanceId],
      }),
      timeoutMs: DEEPGRAM_TIMEOUTS.manage,
      operation: 'get the credit balance',
    });
    return flattenBalance({
      ...(response.body ?? {}),
      balance_id: response.body?.balance_id ?? balanceId,
    });
  },
});
