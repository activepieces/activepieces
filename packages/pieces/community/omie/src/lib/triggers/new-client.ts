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
    const items = await omieClient.listAll<ClientItem>({
      auth,
      endpoint: omieEndpoints.clients,
      ...omieClient.pollingPages({ lastFetchEpochMS }),
      filters: {
        apenas_importado_api: 'N',
        filtrar_por_data_de: since.date,
        filtrar_por_hora_de: since.time,
        filtrar_apenas_inclusao: 'S',
      },
    });
    return items.flatMap((item) => {
      const epochMilliSeconds = omieClient.fromOmieDateTime({
        date: item.info?.dInc,
        time: item.info?.hInc,
      });
      return epochMilliSeconds === undefined ? [] : [{ epochMilliSeconds, data: item }];
    });
  },
};

export const newClient = createTrigger({
  auth: omieAuth,
  name: 'new_client',
  classification: 'READ',
  displayName: 'New Client',
  description: 'Triggers when a new client or supplier is registered in Omie.',
  aiMetadata: {
    description:
      'Fires once per client or supplier newly registered in Omie, polling for records created since the last check. One payload is one client record.',
  },
  props: {},
  sampleData: {
    codigo_cliente_omie: 12345,
    codigo_cliente_integracao: 'CodigoInterno0001',
    razao_social: 'Primeiro Cliente Ltda Me',
    nome_fantasia: 'Primeiro Cliente',
    cnpj_cpf: '80.716.929/0001-50',
    email: 'primeiro@cliente.com.br',
    info: { dInc: '30/09/2026', hInc: '10:15:00' },
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

type ClientItem = { info?: { dInc?: string; hInc?: string } };
