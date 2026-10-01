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
    const items = await omieClient.listAll<MovementItem>({
      auth,
      endpoint: omieEndpoints.movements,
      ...omieClient.pollingPages({ lastFetchEpochMS }),
      filters: {
        dDtAltDe: since.date,
        dDtAltAte: omieClient.toOmieDateTime({ epochMs: Date.now() }).date,
      },
    });
    return items.flatMap((item) => {
      const epochMilliSeconds = omieClient.fromOmieDateTime({
        date: item.detalhes?.dAlt,
        time: item.detalhes?.hAlt,
      });
      return epochMilliSeconds === undefined ? [] : [{ epochMilliSeconds, data: item }];
    });
  },
};

export const updatedFinancialMovement = createTrigger({
  auth: omieAuth,
  name: 'updated_financial_movement',
  classification: 'READ',
  displayName: 'Updated Financial Movement',
  description: 'Triggers when a financial movement is changed in Omie.',
  aiMetadata: {
    description:
      'Fires once per financial movement (payable, receivable or transfer) changed in Omie since the last check, for example when it is paid. One payload is the current movement with its details and summary.',
  },
  props: {},
  sampleData: {
    detalhes: {
      nCodTitulo: 3846660524,
      cNumTitulo: 'NF-1042',
      cGrupo: 'CONTA_A_PAGAR',
      nValorTitulo: 100,
      dDtVenc: '30/10/2026',
      dInc: '30/09/2026',
      hInc: '10:15:00',
      dAlt: '30/09/2026',
      hAlt: '16:20:00',
    },
    resumo: { cLiquidado: 'S', nValAberto: 0, nValPago: 100 },
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

type MovementItem = { detalhes?: { dAlt?: string; hAlt?: string } };
