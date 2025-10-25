import { createAction, Property } from '@activepieces/pieces-framework';
import bs58 from 'bs58';
import { signAndSendRequest } from '../common/signer';
import { PineautoAuthType } from '../../index';

interface TradingViewOrderEvent {
  symbol: string;
  leverage?: number;
  side: 'buy' | 'sell';
  qtyMode: 'percent' | 'fixed';
  qty: number;
  clientOrderId?: string;
  rawPayload?: unknown;
  emittedAt?: number;
}

interface OrderSizingResult {
  quantity: number;
  referencePrice?: number;
  availableBalance?: number;
  quoteAsset?: string | null;
  notional?: number;
  fallbackQuantity?: number;
  leverageApplied: number;
}

type OrderResponsePayload = {
  data?: Record<string, unknown>;
  [key: string]: unknown;
};

interface AccountInfoResponse {
  data?: Record<string, unknown>;
}

interface AccountBalancesResponse {
  data?: Record<string, unknown>;
}

export const createOrder = createAction({
  name: 'create_order',
  displayName: 'Create Order',
  description: 'Create a MARKET order on Orderly Network based on a TradingView webhook event.',
  props: {
    order_event: Property.Json({
      displayName: 'Order Event',
      description: 'Pass the JSON emitted by the TradingView trigger (예: {{steps.trigger}}).',
      required: true,
    }),
    reduce_only: Property.Checkbox({
      displayName: 'Reduce Only',
      description: 'Only reduce existing exposure. Enable when exiting positions.',
      required: false,
      defaultValue: false,
    }),
    client_order_id: Property.ShortText({
      displayName: 'Client Order ID Override',
      description: 'Optional identifier (<= 36 chars). Overrides value from the event.',
      required: false,
      defaultValue: '',
    }),
  },

  async run(context) {
    if (!context.auth) {
      throw new Error('Authentication is required. Please connect your Orderly account.');
    }

    const auth = context.auth as PineautoAuthType;
    const baseUrl = auth.environment === 'mainnet'
      ? 'https://api.orderly.org'
      : 'https://testnet-api.orderly.org';

    const props = context.propsValue as {
      order_event: unknown;
      reduce_only?: boolean;
      client_order_id?: string;
    };

    const event = ensureOrderEvent(props.order_event);

    const privateKey = bs58.decode(auth.secret_key);
    const quoteAsset = parseQuoteAsset(event.symbol);

    const sizing = await resolveOrderSizing({
      event,
      auth,
      baseUrl,
      privateKey,
      quoteAsset,
    });

    const orderQuantity = sizing.quantity;
    if (!Number.isFinite(orderQuantity) || orderQuantity <= 0) {
      throw new Error('Calculated order quantity is invalid. Check trigger sizing settings.');
    }

    const side = event.side === 'buy' ? 'BUY' : 'SELL';

    const baseOrderData: Record<string, unknown> = {
      symbol: event.symbol,
      side,
      order_type: 'MARKET',
      type: 'MARKET',
    };

    if (props.reduce_only) {
      baseOrderData['reduce_only'] = true;
    }

    const clientOrderId = selectClientOrderId(event.clientOrderId, props.client_order_id);
    if (clientOrderId) {
      baseOrderData['client_order_id'] = clientOrderId;
    }

    const sendOrder = async (
      quantityToUse: number,
    ): Promise<{
      response: Response;
      result: OrderResponsePayload;
      normalizedQty: number;
    }> => {
      const normalizedQty = normalizeNumber(quantityToUse, 6);
      const payload: Record<string, unknown> = {
        ...baseOrderData,
        order_quantity: normalizedQty,
        quantity: normalizedQty,
      };

      console.log('📤 Sending market order:', {
        ...payload,
        environment: auth.environment,
        account: `${auth.account_id.substring(0, 8)}...`,
      });

      const response = await signAndSendRequest(
        auth.account_id,
        privateKey,
        `${baseUrl}/v1/order`,
        {
          method: 'POST',
          body: JSON.stringify(payload),
        },
      );

      const result = await response.json() as OrderResponsePayload;

      return { response, result, normalizedQty };
    };

    const retryStep = determineFlexibleQuantityStep(undefined) || 0.001;
    let attemptQuantity = orderQuantity;
    let usedFallbackQuantity = !sizing.fallbackQuantity;

    for (let attempt = 0; attempt < 6; attempt++) {
      try {
        const { response, result, normalizedQty } = await sendOrder(attemptQuantity);

        if (!response.ok) {
          const messageText = typeof result['message'] === 'string'
            ? result['message'] as string
            : undefined;
          const errorText = typeof result['error'] === 'string'
            ? result['error'] as string
            : undefined;
          const errorMessage = messageText
            || errorText
            || `Order creation failed with status ${response.status}`;

          if (response.status === 400) {
            if (errorMessage.toLowerCase().includes('insufficient')) {
              const reducedQuantity = applyQuantityStep(attemptQuantity * 0.8, retryStep);
              if (reducedQuantity <= 0 || Math.abs(reducedQuantity - attemptQuantity) < 1e-8) {
                throw new Error('❌ Insufficient balance for this order. Please check available collateral.');
              }
              console.warn('[pineauto] Reducing quantity due to insufficient balance.', {
                previousQuantity: attemptQuantity,
                reducedQuantity,
              });
              attemptQuantity = reducedQuantity;
              continue;
            }
            if (errorMessage.toLowerCase().includes('quantity')) {
              throw new Error(`❌ Invalid quantity detected. Computed value: ${attemptQuantity}`);
            }
            if (
              errorMessage.includes('filter requirement')
              && sizing.fallbackQuantity
              && !usedFallbackQuantity
              && Math.abs(sizing.fallbackQuantity - orderQuantity) > 1e-8
            ) {
              console.warn('[pineauto] Retrying order with fallback quantity due to filter requirement.', {
                originalQuantity: orderQuantity,
                fallbackQuantity: sizing.fallbackQuantity,
              });
              attemptQuantity = sizing.fallbackQuantity;
              usedFallbackQuantity = true;
              continue;
            }
            throw new Error(`❌ Invalid order parameters: ${errorMessage}`);
          }
          if (response.status === 401) {
            throw new Error('🔐 Authentication failed. Please verify your Orderly credentials.');
          }
          if (response.status === 403) {
            throw new Error('🚫 Account lacks permission or is not activated. Check Orderly account status.');
          }
          if (response.status === 429) {
            throw new Error('⏱️ Rate limit exceeded. Please wait and try again.');
          }
          if (response.status === 503) {
            throw new Error('🔧 Orderly service unavailable. Retry later.');
          }

          throw new Error(errorMessage);
        }

        const orderData = (result['data'] ?? {}) as Record<string, unknown>;
        const orderId = orderData['order_id'] ?? result['order_id'] ?? null;
        const orderStatus = orderData['order_status'] ?? result['order_status'] ?? 'PENDING';
        const resolvedClientId = orderData['client_order_id'] ?? result['client_order_id'] ?? clientOrderId;
        const orderSymbol = (orderData['symbol'] ?? result['symbol'] ?? event.symbol) as string;
        const orderSide = (orderData['side'] ?? result['side'] ?? side) as string;
        const orderType = (orderData['order_type'] ?? result['order_type'] ?? 'MARKET') as string;
        const resolvedQuantity = orderData['order_quantity'] ?? orderData['quantity'] ?? result['order_quantity'] ?? result['quantity'] ?? normalizedQty;
        const avgPrice = orderData['avg_executed_price'] ?? result['avg_executed_price'] ?? sizing.referencePrice ?? null;
        const createdTime = (orderData['created_time'] ?? result['created_time']) as string | undefined;

        console.log('✅ Order created successfully:', {
          order_id: orderId,
          status: orderStatus,
        });

        return {
          success: true,
          message: `✅ ${side === 'BUY' ? '🟢 Buy' : '🔴 Sell'} market order created successfully!`,
          order_id: orderId,
          client_order_id: resolvedClientId,
          status: orderStatus,
          symbol: orderSymbol,
          side: orderSide,
          type: orderType,
          quantity: resolvedQuantity,
          average_price: avgPrice,
          notional: sizing.notional ?? null,
          available_balance: sizing.availableBalance ?? null,
          quote_asset: sizing.quoteAsset ?? parseQuoteAsset(event.symbol) ?? null,
          leverage: sizing.leverageApplied,
          timestamp: createdTime || new Date().toISOString(),
          raw_response: orderData,
          trigger_event: event,
        };
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        const lowerMessage = message.toLowerCase();

        if (lowerMessage.includes('fetch') || lowerMessage.includes('network')) {
          throw new Error('🌐 Network error. Please check your connection and retry.');
        }

        if (message.includes('❌') && !lowerMessage.includes('insufficient balance')) {
          throw error instanceof Error ? error : new Error(message);
        }

        if (!lowerMessage.includes('insufficient')) {
          throw error instanceof Error ? error : new Error(message);
        }

        const reducedQuantity = applyQuantityStep(attemptQuantity * 0.8, retryStep);
        if (reducedQuantity <= 0 || Math.abs(reducedQuantity - attemptQuantity) < 1e-8) {
          throw new Error('❌ Insufficient balance for this order. Please check available collateral.');
        }
        console.warn('[pineauto] Reducing quantity due to insufficient balance.', {
          previousQuantity: attemptQuantity,
          reducedQuantity,
        });
        attemptQuantity = reducedQuantity;
      }
    }

    throw new Error('❌ Insufficient balance for this order. Please check available collateral.');
  },
});

function ensureOrderEvent(value: unknown): TradingViewOrderEvent {
  if (!value || typeof value !== 'object') {
    throw new Error('Order event must be a JSON object.');
  }

  const event = value as Record<string, unknown>;

  const symbolValue = event['symbol'];
  const symbol = typeof symbolValue === 'string' && symbolValue.trim().length > 0
    ? symbolValue.trim()
    : null;
  if (!symbol) {
    throw new Error('Order event must include a symbol.');
  }

  const rawSideValue = event['side'];
  const rawSide = typeof rawSideValue === 'string' ? rawSideValue.toLowerCase() : '';
  if (rawSide !== 'buy' && rawSide !== 'sell') {
    throw new Error('Order event side must be "buy" or "sell".');
  }

  const rawQtyModeValue = event['qtyMode'] ?? event['qty_mode'];
  const rawQtyMode = typeof rawQtyModeValue === 'string' ? rawQtyModeValue.toLowerCase() : '';
  if (rawQtyMode !== 'percent' && rawQtyMode !== 'fixed') {
    throw new Error('Order event qtyMode must be "percent" or "fixed".');
  }

  const qty = Number(event['qty']);
  if (!Number.isFinite(qty) || qty <= 0) {
    throw new Error('Order event qty must be a positive number.');
  }

  const leverage = Number(event['leverage']);

  return {
    symbol,
    side: rawSide as 'buy' | 'sell',
    qtyMode: rawQtyMode as 'percent' | 'fixed',
    qty,
    leverage: Number.isFinite(leverage) && leverage > 0 ? leverage : 1,
    clientOrderId: typeof event['clientOrderId'] === 'string'
      ? (event['clientOrderId'] as string)
      : undefined,
    rawPayload: event['rawPayload'],
    emittedAt: typeof event['emittedAt'] === 'number' ? Number(event['emittedAt']) : undefined,
  };
}

function selectClientOrderId(eventId: string | undefined, overrideId?: string): string | undefined {
  const cleanedOverride = overrideId?.trim();
  if (cleanedOverride) {
    if (cleanedOverride.length > 36) {
      throw new Error('Client order ID must be 36 characters or fewer.');
    }
    return cleanedOverride;
  }

  if (eventId && eventId.trim().length > 0) {
    const trimmed = eventId.trim();
    if (trimmed.length > 36) {
      throw new Error('Client order ID from event exceeds 36 characters.');
    }
    return trimmed;
  }

  return undefined;
}

interface ResolveOrderSizingParams {
  event: TradingViewOrderEvent;
  auth: PineautoAuthType;
  baseUrl: string;
  privateKey: Uint8Array;
  quoteAsset: string | null;
}

async function resolveOrderSizing(params: ResolveOrderSizingParams): Promise<OrderSizingResult> {
  const {
    event,
    auth,
    baseUrl,
    privateKey,
    quoteAsset,
  } = params;

  const leverageApplied = Math.max(1, Number(event.leverage) || 1);

  if (event.qtyMode === 'fixed') {
    const adjustedQty = applyQuantityStep(event.qty, determineFlexibleQuantityStep(event.qty));
    const fallbackQuantity = applyQuantityStep(event.qty, determineStrictQuantityStep(event.qty) ?? event.qty);
    const notional = adjustedQty * leverageApplied;

    return {
      quantity: adjustedQty,
      referencePrice: undefined,
      quoteAsset: quoteAsset ?? parseQuoteAsset(event.symbol),
      fallbackQuantity,
      leverageApplied,
      notional,
    };
  }

  const percent = event.qty;

  const referencePrice = await fetchReferencePrice({
    baseUrl,
    symbol: event.symbol,
  });

  const accountInfo = await fetchAccountInfo(baseUrl, auth, privateKey);
  let availableBalance = extractAvailableBalance(accountInfo, quoteAsset ?? parseQuoteAsset(event.symbol));
  console.log('[pineauto] account info raw', accountInfo);
  console.log('[pineauto] extracted balance from account info', availableBalance);

  if (availableBalance == null) {
    const balances = await fetchAccountBalances(baseUrl, auth, privateKey);
    availableBalance = extractAvailableBalanceFromBalances(balances, quoteAsset ?? parseQuoteAsset(event.symbol));
    console.log('[pineauto] account balances raw', balances);
    console.log('[pineauto] extracted balance from account balances', availableBalance);
  }

  if (availableBalance == null) {
    const holdings = await fetchClientHolding(baseUrl, auth, privateKey);
    availableBalance = extractBalanceFromHoldings(holdings, quoteAsset ?? parseQuoteAsset(event.symbol));
    console.log('[pineauto] client holding raw', holdings);
    console.log('[pineauto] extracted balance from holdings', availableBalance);
  }

  if (availableBalance == null || availableBalance <= 0) {
    throw new Error('Unable to determine available collateral from account info or balance endpoints.');
  }

  const notional = availableBalance * (percent / 100) * leverageApplied;
  if (!Number.isFinite(notional) || notional <= 0) {
    throw new Error('Calculated notional value is invalid. Check balance percent and leverage settings.');
  }

  const rawQuantity = notional / referencePrice;
  const flexibleStep = determineFlexibleQuantityStep(undefined);
  const strictStep = determineStrictQuantityStep(undefined);
  const quantity = applyQuantityStep(rawQuantity, flexibleStep);
  const fallbackQuantity = strictStep ? applyQuantityStep(rawQuantity, strictStep) : undefined;

  return {
    quantity,
    referencePrice,
    availableBalance,
    quoteAsset: quoteAsset ?? parseQuoteAsset(event.symbol),
    notional,
    fallbackQuantity,
    leverageApplied,
  };
}

async function fetchAccountBalances(
  baseUrl: string,
  auth: PineautoAuthType,
  privateKey: Uint8Array,
): Promise<AccountBalancesResponse | null> {
  try {
    const response = await signAndSendRequest(
      auth.account_id,
      privateKey,
      `${baseUrl}/v1/client/balance`,
      { method: 'GET' },
    );

    if (!response.ok) {
      const errorBody = await response.text();
      console.warn('[pineauto] account balance request failed', {
        status: response.status,
        statusText: response.statusText,
        body: errorBody,
      });
      return null;
    }

    return await response.json();
  } catch (error) {
    console.warn('[pineauto] Failed to fetch account balances:', error);
    return null;
  }
}

async function fetchAccountInfo(
  baseUrl: string,
  auth: PineautoAuthType,
  privateKey: Uint8Array,
): Promise<AccountInfoResponse | null> {
  try {
    const response = await signAndSendRequest(
      auth.account_id,
      privateKey,
      `${baseUrl}/v1/client/info`,
      { method: 'GET' },
    );

    if (!response.ok) {
      const errorBody = await response.text();
      console.warn('[pineauto] account info request failed', {
        status: response.status,
        statusText: response.statusText,
        body: errorBody,
      });
      return null;
    }

    return await response.json();
  } catch (error) {
    console.warn('[pineauto] Failed to fetch account info:', error);
    return null;
  }
}

async function fetchClientHolding(
  baseUrl: string,
  auth: PineautoAuthType,
  privateKey: Uint8Array,
): Promise<AccountBalancesResponse | null> {
  try {
    const response = await signAndSendRequest(
      auth.account_id,
      privateKey,
      `${baseUrl}/v1/client/holding`,
      { method: 'GET' },
    );

    if (!response.ok) {
      const errorBody = await response.text();
      console.warn('[pineauto] client holding request failed', {
        status: response.status,
        statusText: response.statusText,
        body: errorBody,
      });
      return null;
    }

    return await response.json();
  } catch (error) {
    console.warn('[pineauto] Failed to fetch client holding:', error);
    return null;
  }
}

function extractAvailableBalance(
  info: AccountInfoResponse | null,
  quoteAsset?: string | null,
): number | null {
  if (!info || !info.data) {
    return null;
  }

  const directKeys = [
    'total_available_balance',
    'available_balance',
    'available',
    'free_collateral',
    'available_withdrawal',
  ];

  for (const key of directKeys) {
    const value = (info.data as Record<string, unknown>)[key];
    const numeric = Number(value);
    if (Number.isFinite(numeric)) {
      return numeric;
    }
  }

  const dataRecord = info.data as Record<string, unknown>;
  const balances = (dataRecord['balances'] as Record<string, unknown> | undefined)
    || (dataRecord['asset_balances'] as Record<string, unknown> | undefined)
    || (dataRecord['collaterals'] as Record<string, unknown> | undefined);

  if (balances) {
    const candidate = pickBalanceRecord(balances, quoteAsset);
    if (candidate != null) {
      return candidate;
    }
  }

  return null;
}

function extractAvailableBalanceFromBalances(
  balancesResponse: AccountBalancesResponse | null,
  quoteAsset?: string | null,
): number | null {
  if (!balancesResponse || !balancesResponse.data) {
    return null;
  }

  const balances = balancesResponse.data as Record<string, unknown>;
  return pickBalanceRecord(balances, quoteAsset);
}

function extractBalanceFromHoldings(
  holdingsResponse: AccountBalancesResponse | null,
  quoteAsset?: string | null,
): number | null {
  if (!holdingsResponse || !holdingsResponse.data) {
    return null;
  }

  const data = holdingsResponse.data as Record<string, unknown>;
  const holdingList = Array.isArray(data['holding']) ? data['holding'] as unknown[] : [];
  for (const entry of holdingList) {
    if (entry && typeof entry === 'object') {
      const obj = entry as Record<string, unknown>;
      const asset = getAssetCode(obj);
      if (!quoteAsset || normalizeAsset(asset) === normalizeAsset(quoteAsset)) {
        const numeric = Number(obj['available'] ?? obj['holding'] ?? obj['balance']);
        if (Number.isFinite(numeric)) {
          return numeric;
        }
      }
    }
  }

  return null;
}

function pickBalanceRecord(
  balances: Record<string, unknown>,
  quoteAsset?: string | null,
): number | null {
  if (!balances) {
    return null;
  }

  if (quoteAsset) {
    const normalizedAsset = normalizeAsset(quoteAsset);
    for (const value of Object.values(balances)) {
      if (value && typeof value === 'object') {
        const entry = value as Record<string, unknown>;
        const asset = getAssetCode(entry);
        if (normalizeAsset(asset) === normalizedAsset) {
          return extractNumericBalance(entry);
        }
      }
    }
  }

  for (const value of Object.values(balances)) {
    if (value && typeof value === 'object') {
      const numeric = extractNumericBalance(value);
      if (numeric != null) {
        return numeric;
      }
    }
  }

  return null;
}

function extractNumericBalance(entry: unknown): number | null {
  if (entry && typeof entry === 'object') {
    const keys = [
      'available_balance',
      'available',
      'free_collateral',
      'holding',
      'balance',
      'equity',
    ];

    for (const key of keys) {
      if (key in (entry as Record<string, unknown>)) {
        const value = (entry as Record<string, unknown>)[key];
        const numeric = Number(value);
        if (Number.isFinite(numeric)) {
          return numeric;
        }
      }
    }
  }

  return null;
}

function getAssetCode(entry: unknown): string | null {
  if (entry && typeof entry === 'object') {
    const obj = entry as Record<string, unknown>;
    const fields = ['asset', 'symbol', 'token', 'currency'];
    for (const field of fields) {
      const value = obj[field];
      if (typeof value === 'string') {
        return value;
      }
    }
  }
  return null;
}

function parseQuoteAsset(symbol: string): string | null {
  if (!symbol || typeof symbol !== 'string') {
    return null;
  }

  const parts = symbol.split('_');
  if (parts.length >= 3) {
    return parts[parts.length - 1];
  }

  return null;
}

function normalizeAsset(asset: string | null | undefined): string {
  return asset?.toUpperCase?.() ?? '';
}

function normalizeNumber(value: number, dp: number): number {
  const factor = 10 ** dp;
  return Math.round(value * factor) / factor;
}

function determineFlexibleQuantityStep(referenceQuantity?: number): number {
  const strictStep = determineStrictQuantityStep(referenceQuantity);
  if (!strictStep) {
    return 0.001;
  }

  if (strictStep >= 1) {
    return strictStep;
  }

  return Math.min(strictStep, 0.001);
}

function determineStrictQuantityStep(referenceQuantity?: number): number | null {
  if (!referenceQuantity || referenceQuantity === 0) {
    return null;
  }

  const qtyString = referenceQuantity.toString();
  if (qtyString.includes('e')) {
    return null;
  }

  const decimals = qtyString.split('.')[1]?.length ?? 0;
  return decimals > 0 ? Math.pow(10, -decimals) : 1;
}

function applyQuantityStep(quantity: number, step: number): number {
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return quantity;
  }

  if (!step || step <= 0) {
    return quantity;
  }

  const multiplier = Math.floor(quantity / step);
  const adjusted = multiplier * step;

  const decimals = step >= 1 ? 0 : Math.min(8, Math.abs(Math.log10(step)));
  if (adjusted > 0) {
    return Number(adjusted.toFixed(decimals));
  }

  return Number(step.toFixed(decimals));
}

async function fetchReferencePrice(params: {
  baseUrl: string;
  symbol: string;
  fallbackPrice?: number;
}): Promise<number> {
  const { baseUrl, symbol, fallbackPrice } = params;

  if (Number.isFinite(fallbackPrice) && fallbackPrice && fallbackPrice > 0) {
    return Number(fallbackPrice);
  }

  const firstPositiveNumber = (...values: unknown[]): number | null => {
    for (const value of values) {
      const numeric = Number(value);
      if (Number.isFinite(numeric) && numeric > 0) {
        return numeric;
      }
    }
    return null;
  };

  try {
    const futuresUrl = `${baseUrl}/v1/public/futures/${encodeURIComponent(symbol)}`;
    const futuresResponse = await fetch(futuresUrl);
    if (futuresResponse.ok) {
      const futuresBody = await futuresResponse.json() as Record<string, unknown>;
      const dataField = futuresBody['data'];

      if (Array.isArray(dataField)) {
        for (const entry of dataField) {
          const numeric = firstPositiveNumber(
            (entry as Record<string, unknown>)?.['mark_price'],
            (entry as Record<string, unknown>)?.['last_price'],
            (entry as Record<string, unknown>)?.['index_price'],
            (entry as Record<string, unknown>)?.['24h_close'],
          );
          if (numeric) {
            return numeric;
          }
        }
      }

      if (dataField && typeof dataField === 'object') {
        const numeric = firstPositiveNumber(
          (dataField as Record<string, unknown>)['mark_price'],
          (dataField as Record<string, unknown>)['last_price'],
          (dataField as Record<string, unknown>)['index_price'],
          (dataField as Record<string, unknown>)['24h_close'],
        );
        if (numeric) {
          return numeric;
        }
      }

      const directFallback = firstPositiveNumber(
        futuresBody['mark_price'],
        futuresBody['last_price'],
      );
      if (directFallback) {
        return directFallback;
      }
    }
  } catch (error) {
    console.warn('[pineauto] Failed to fetch futures ticker price', {
      symbol,
      error,
    });
  }

  try {
    const tickerUrl = new URL(`${baseUrl}/v1/public/market_info`);
    tickerUrl.searchParams.set('symbol', symbol);
    const tickerResponse = await fetch(tickerUrl.toString());
    if (tickerResponse.ok) {
      const tickerBody = await tickerResponse.json() as Record<string, unknown>;
      const dataField = tickerBody['data'];
      if (Array.isArray(dataField)) {
        for (const entry of dataField) {
          const numeric = firstPositiveNumber(
            (entry as Record<string, unknown>)?.['mark_price'],
            (entry as Record<string, unknown>)?.['last_price'],
            (entry as Record<string, unknown>)?.['index_price'],
          );
          if (numeric) {
            return numeric;
          }
        }
      }

      if (dataField && typeof dataField === 'object') {
        const numeric = firstPositiveNumber(
          (dataField as Record<string, unknown>)['mark_price'],
          (dataField as Record<string, unknown>)['last_price'],
          (dataField as Record<string, unknown>)['index_price'],
        );
        if (numeric) {
          return numeric;
        }
      }

      const directFallback = firstPositiveNumber(
        tickerBody['mark_price'],
        tickerBody['last_price'],
      );
      if (directFallback) {
        return directFallback;
      }
    }
  } catch (error) {
    console.warn('[pineauto] Failed to fetch market ticker price', {
      symbol,
      error,
    });
  }

  try {
    const tradesUrl = new URL(`${baseUrl}/v1/public/market_trades`);
    tradesUrl.searchParams.set('symbol', symbol);
    tradesUrl.searchParams.set('limit', '1');
    const response = await fetch(tradesUrl.toString());
    if (response.ok) {
      const body = await response.json() as Record<string, unknown>;
      const dataField = body['data'];
      const trades: Array<Record<string, unknown>> = [];

      if (Array.isArray(dataField)) {
        trades.push(...dataField as Array<Record<string, unknown>>);
      } else if (dataField && typeof dataField === 'object' && Array.isArray((dataField as Record<string, unknown>)['rows'])) {
        trades.push(...(dataField as Record<string, unknown>)['rows'] as Array<Record<string, unknown>>);
      } else if (Array.isArray(body)) {
        trades.push(...(body as Array<Record<string, unknown>>));
      }

      const firstTrade = trades[0];
      if (firstTrade) {
        const numeric = firstPositiveNumber(
          firstTrade['price'],
          firstTrade['trade_price'],
          firstTrade['executed_price'],
        );
        if (numeric) {
          return numeric;
        }
      }
    }
  } catch (error) {
    console.warn('[pineauto] Failed to fetch recent trade price', {
      symbol,
      error,
    });
  }

  throw new Error('Market price could not be determined automatically. Provide price in the trigger payload or ensure recent trades exist.');
}
