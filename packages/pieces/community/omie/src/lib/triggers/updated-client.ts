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
        filtrar_apenas_alteracao: 'S',
      },
    });
    return items.flatMap((item) => {
      const epochMilliSeconds = omieClient.fromOmieDateTime({
        date: item.info?.dAlt,
        time: item.info?.hAlt,
      });
      return epochMilliSeconds === undefined ? [] : [{ epochMilliSeconds, data: item }];
    });
  },
};

export const updatedClient = createTrigger({
  auth: omieAuth,
  name: 'updated_client',
  classification: 'READ',
  displayName: 'Updated Client',
  description: 'Triggers when a client or supplier is changed in Omie.',
  aiMetadata: {
    description:
      'Fires once per client or supplier changed in Omie since the last check. One payload is the current client record.',
  },
  props: {},
  sampleData: {
    codigo_cliente_omie: 12345,
    codigo_cliente_integracao: 'CodigoInterno0001',
    razao_social: 'Primeiro Cliente Ltda Me',
    nome_fantasia: 'Primeiro Cliente',
    cnpj_cpf: '80.716.929/0001-50',
    email: 'novo@cliente.com.br',
    info: { dInc: '30/09/2026', hInc: '10:15:00', dAlt: '30/09/2026', hAlt: '11:40:00' },
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

type ClientItem = { info?: { dAlt?: string; hAlt?: string } };
