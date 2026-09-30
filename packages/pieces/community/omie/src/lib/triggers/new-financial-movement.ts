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
      filters: {
        dDtIncDe: since.date,
        dDtIncAte: omieClient.toOmieDateTime({ epochMs: Date.now() }).date,
      },
    });
    return items.flatMap((item) => {
      const epochMilliSeconds = omieClient.fromOmieDateTime({
        date: item.detalhes?.dInc,
        time: item.detalhes?.hInc,
      });
      return epochMilliSeconds === undefined ? [] : [{ epochMilliSeconds, data: item }];
    });
  },
};

export const newFinancialMovement = createTrigger({
  auth: omieAuth,
  name: 'new_financial_movement',
  classification: 'READ',
  displayName: 'New Financial Movement',
  description: 'Triggers when a new financial movement is created in Omie.',
  aiMetadata: {
    description:
      'Fires once per financial movement (payable, receivable or transfer) created in Omie since the last check. One payload is one movement with its details and summary.',
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
    },
    resumo: { cLiquidado: 'N', nValAberto: 100, nValPago: 0 },
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

type MovementItem = { detalhes?: { dInc?: string; hInc?: string } };
