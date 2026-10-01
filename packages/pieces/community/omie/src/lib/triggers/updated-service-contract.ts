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
        filtrar_apenas_alteracao: 'S',
        cExibirInfoCadastro: 'S',
      },
    });
    return items.flatMap((item) => {
      const epochMilliSeconds = omieClient.fromOmieDateTime({
        date: item.infAdic?.dAlt,
        time: item.infAdic?.hAlt,
      });
      return epochMilliSeconds === undefined ? [] : [{ epochMilliSeconds, data: item }];
    });
  },
};

export const updatedServiceContract = createTrigger({
  auth: omieAuth,
  name: 'updated_service_contract',
  classification: 'READ',
  displayName: 'Updated Service Contract',
  description: 'Triggers when a service contract is changed in Omie.',
  aiMetadata: {
    description:
      'Fires once per service contract changed in Omie since the last check. One payload is the current contract with its header and registration info.',
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
    infAdic: { dInc: '30/09/2026', hInc: '10:15:00', dAlt: '30/09/2026', hAlt: '11:40:00' },
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

type ContractItem = { infAdic?: { dAlt?: string; hAlt?: string } };
