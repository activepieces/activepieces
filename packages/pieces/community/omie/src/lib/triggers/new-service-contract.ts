import {
  AppConnectionValueForAuthProperty,
  createTrigger,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { omieAuth } from '../auth';
import { omieClient } from '../common/client';
import { omieEndpoints } from '../common/endpoints';

const polling: Polling<AppConnectionValueForAuthProperty<typeof omieAuth>, Record<string, never>> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, lastFetchEpochMS }) => {
    const since = omieClient.pollingSince({ lastFetchEpochMS });
    const items = await omieClient.listAll<ContractItem>({
      auth,
      endpoint: omieEndpoints.contracts,
      ...omieClient.pollingPages({ lastFetchEpochMS }),
      filters: {
        filtrar_por_data_de: since.date,
        filtrar_apenas_inclusao: 'S',
        cExibirInfoCadastro: 'S',
      },
    });
    return items.flatMap((item) => {
      const epochMilliSeconds = omieClient.fromOmieDateTime({
        date: item.infAdic?.dInc,
        time: item.infAdic?.hInc,
      });
      return epochMilliSeconds === undefined ? [] : [{ epochMilliSeconds, data: item }];
    });
  },
};

export const newServiceContract = createTrigger({
  auth: omieAuth,
  name: 'new_service_contract',
  classification: 'READ',
  displayName: 'New Service Contract',
  description: 'Triggers when a new service contract is created in Omie.',
  aiMetadata: {
    description:
      'Fires once per service contract created in Omie since the last check. One payload is one contract with its header and registration info.',
  },
  props: {},
  sampleData: {
    cabecalho: {
      nCodCtr: 2203959,
      cCodIntCtr: '019289Tb3',
      cNumCtr: '2026/01001',
      nCodCli: 2370765,
      dVigInicial: '01/10/2026',
      dVigFinal: '30/09/2027',
    },
    infAdic: { dInc: '30/09/2026', hInc: '10:15:00' },
  },
  type: TriggerStrategy.POLLING,
  async test(context) {
    return pollingHelper.test(polling, context);
  },
  async onEnable(context) {
    await pollingHelper.onEnable(polling, context);
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, context);
  },
  async run(context) {
    return pollingHelper.poll(polling, context);
  },
});

type ContractItem = { infAdic?: { dInc?: string; hInc?: string } };
