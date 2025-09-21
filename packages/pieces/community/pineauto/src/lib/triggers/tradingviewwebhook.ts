import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { MarkdownVariant } from '@activepieces/shared';

interface TradingViewWebhookPayload {
  secret?: string;
  side?: string;
  qty_mode?: string;
  qty?: unknown;
  client_order_id?: string;
  [key: string]: unknown;
}

export interface TradingViewOrderEvent {
  symbol: string;
  leverage: number;
  side: 'buy' | 'sell';
  qtyMode: 'percent' | 'fixed';
  qty: number;
  clientOrderId?: string;
  rawPayload: unknown;
  emittedAt: number;
}

interface TriggerProps {
  webhook_secret: string;
  default_symbol: string;
  leverage: number;
}

export const tradingviewwebhook = createTrigger({
  name: 'tradingview_webhook',
  displayName: 'TradingView Alert',
  description: 'Receives trading signals from TradingView alerts via webhook',
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    symbol: 'PERP_BTC_USDC',
    leverage: 2,
    side: 'buy',
    qtyMode: 'percent',
    qty: 10,
    clientOrderId: 'BTCUSDT-1704110400',
    rawPayload: {
      secret: '12345678',
      side: 'buy',
      qty_mode: 'percent',
      qty: 10,
      client_order_id: 'BTCUSDT-1704110400',
    },
    emittedAt: 1704110400000,
  } satisfies TradingViewOrderEvent,
  props: {
    help_text: Property.MarkDown({
      value: `### TradingView Webhook JSON\n\nSend alerts with this minimal payload:\n\n\`\`\`json\n{\n  "secret": "YOUR_SECRET",\n  "side": "buy",\n  "qty_mode": "percent",\n  "qty": 10,\n  "client_order_id": ""\n}\n\`\`\`\n\n- \`secret\`: must match the secret configured below\n- \`side\`: \`buy\` or \`sell\`\n- \`qty_mode\`: \`percent\` (quote balance %) or \`fixed\` (base quantity)\n- \`qty\`: number interpreted according to \`qty_mode\`\n- \`client_order_id\` (optional) helps deduplicate alerts\n\nSymbol, leverage multiplier, and market order type come from the flow configuration.`,
      variant: MarkdownVariant.INFO,
    }),
    live_url: Property.MarkDown({
      value: `### Live Webhook URL\n\n\`\`\`text\n{{webhookUrl}}\n\`\`\`\nShare this URL with TradingView alerts.`,
      variant: MarkdownVariant.BORDERLESS,
    }),
    webhook_secret: Property.ShortText({
      displayName: 'Webhook Secret',
      description: 'TradingView payload must include this secret.',
      required: true,
    }),
    default_symbol: Property.ShortText({
      displayName: 'Orderly Symbol',
      description: 'Symbol to trade (e.g., PERP_BTC_USDC).',
      required: true,
      defaultValue: 'PERP_BTC_USDC',
    }),
    leverage: Property.Number({
      displayName: 'Leverage',
      description: 'Multiplier applied to the notional size (e.g., 3 → 3× of base collateral).',
      required: true,
      defaultValue: 1,
    }),
  },

  async test() {
    return [
      {
        symbol: 'PERP_BTC_USDC',
        leverage: 1,
        side: 'buy',
        qtyMode: 'percent',
        qty: 5,
        clientOrderId: 'TEST-ORDER-123',
        rawPayload: {
          secret: '12345678',
          side: 'buy',
          qty_mode: 'percent',
          qty: 5,
        },
        emittedAt: Date.now(),
      } satisfies TradingViewOrderEvent,
    ];
  },

  async onEnable(context) {
    await context.store.put('_webhook_url', context.webhookUrl);
    console.log('TradingView webhook enabled:', context.webhookUrl);
  },

  async onDisable(context) {
    await context.store.delete('_webhook_url');
    console.log('TradingView webhook disabled');
  },

  async run(context) {
    const propsValue = context.propsValue as unknown as TriggerProps;
    const { webhook_secret, default_symbol, leverage } = propsValue;

    const payload = context.payload;
    if (!payload || !payload.body) {
      console.warn('[pineauto] Missing payload');
      return [];
    }

    const body = payload.body as TradingViewWebhookPayload;

    if (!body || typeof body !== 'object') {
      console.error('[pineauto] Payload is not a JSON object');
      return [];
    }

    if (body.secret !== webhook_secret) {
      console.error('[pineauto] Secret token mismatch');
      return [];
    }

    const sideRaw = String(body.side ?? '').toLowerCase();
    if (sideRaw !== 'buy' && sideRaw !== 'sell') {
      console.error('[pineauto] Invalid side in payload:', body.side);
      return [];
    }

    const qtyModeRaw = String(body.qty_mode ?? '').toLowerCase();
    if (qtyModeRaw !== 'percent' && qtyModeRaw !== 'fixed') {
      console.error('[pineauto] Invalid qty_mode in payload:', body.qty_mode);
      return [];
    }

    const numericQty = Number(body.qty);
    if (!Number.isFinite(numericQty) || numericQty <= 0) {
      console.error('[pineauto] qty must be a positive number:', body.qty);
      return [];
    }

    const event: TradingViewOrderEvent = {
      symbol: default_symbol,
      leverage: Math.max(1, Number(leverage) || 1),
      side: sideRaw as 'buy' | 'sell',
      qtyMode: qtyModeRaw as 'percent' | 'fixed',
      qty: numericQty,
      clientOrderId: typeof body.client_order_id === 'string' ? body.client_order_id : undefined,
      rawPayload: payload.body,
      emittedAt: Date.now(),
    };

    return [event];
  },
});
