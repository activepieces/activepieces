/** Jupiter API base URLs */
export const JUPITER_QUOTE_API_BASE = 'https://quote-api.jup.ag/v6';
export const JUPITER_PRICE_API_BASE = 'https://price.jup.ag/v6';
export const JUPITER_TOKEN_API_BASE = 'https://token.jup.ag';

/** Well-known Solana token mint addresses for convenience */
export const KNOWN_TOKENS = {
  SOL: 'So11111111111111111111111111111111111111112',
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  BTC: '9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E',
  ETH: '2FPyTwcZLUg1MDrwsyoP4D6s1tM7hAkHYRjkNb5w6Pxk',
} as const;
