export const SEND21_API_BASE = 'https://send21.io/api/v1';
export const SEND21_ORIGIN = 'https://send21.io';

export const PAYMENT_CURRENCIES = [
  { label: 'BTC', value: 'Btc' },
  { label: 'USDC', value: 'Usdc' },
  { label: 'USDT', value: 'Usdt' },
  { label: 'EURC', value: 'Eurc' },
  { label: 'SOL', value: 'Sol' },
  { label: 'ETH', value: 'Eth' },
];

export const PAYMENT_NETWORKS = [
  { label: 'Bitcoin (Mainnet)', value: 'Mainnet' },
  { label: 'Solana', value: 'Solana' },
  { label: 'Ethereum', value: 'Ethereum' },
  { label: 'Base', value: 'Base' },
  { label: 'Arbitrum', value: 'Arbitrum' },
  { label: 'Polygon', value: 'Polygon' },
];

export const PAYMENT_METHODS = [
  { label: 'On-chain (MultiOutput)', value: 'MultiOutput' },
  { label: 'Lightning', value: 'Lightning' },
];

export const WEBHOOK_EVENTS = [
  { label: 'draft.created', value: 'draft.created' },
  { label: 'draft.seen', value: 'draft.seen' },
  { label: 'draft.confirmed', value: 'draft.confirmed' },
  { label: 'draft.amount_mismatch', value: 'draft.amount_mismatch' },
  { label: 'draft.mismatch_accepted', value: 'draft.mismatch_accepted' },
  { label: 'draft.mismatch_rejected', value: 'draft.mismatch_rejected' },
  { label: 'draft.mismatch_reminder', value: 'draft.mismatch_reminder' },
  { label: 'draft.mismatch_unresolved', value: 'draft.mismatch_unresolved' },
  { label: 'draft.expired', value: 'draft.expired' },
  { label: 'draft.cancelled', value: 'draft.cancelled' },
  { label: 'payment_request.expired', value: 'payment_request.expired' },
  { label: 'test', value: 'test' },
];

export const DEFAULT_WEBHOOK_EVENTS = [
  'draft.confirmed',
  'draft.amount_mismatch',
  'payment_request.expired',
  'draft.expired',
];
