import { httpClient, HttpMethod } from '@activepieces/pieces-common';

const PUBLIC_SUBGRAPH_URL =
  'https://api.thegraph.com/subgraphs/name/aave/protocol-v3';
const GRAPH_GATEWAY_URL =
  'https://gateway.thegraph.com/api/{apiKey}/subgraphs/id/Cd2gEDVeqnjBn1hSeqFMitw8Q1iiyV9FYUZkLNRcL87g';
const AAVE_RATES_API = 'https://aave-api-v2.aave.com/data/rates-history';

function getSubgraphUrl(apiKey?: string): string {
  if (apiKey && apiKey.trim()) {
    return GRAPH_GATEWAY_URL.replace('{apiKey}', apiKey.trim());
  }
  return PUBLIC_SUBGRAPH_URL;
}

async function querySubgraph(
  query: string,
  variables: Record<string, unknown>,
  apiKey?: string
): Promise<Record<string, unknown>> {
  const url = getSubgraphUrl(apiKey);
  const response = await httpClient.sendRequest<{
    data: Record<string, unknown>;
    errors?: Array<{ message: string }>;
  }>({
    method: HttpMethod.POST,
    url,
    headers: { 'Content-Type': 'application/json' },
    body: { query, variables },
  });

  if (response.body.errors && response.body.errors.length > 0) {
    throw new Error(
      `GraphQL error: ${response.body.errors.map((e) => e.message).join(', ')}`
    );
  }

  return response.body.data;
}

export async function getReserves(apiKey?: string) {
  const query = `
    query GetReserves {
      reserves(first: 100, orderBy: totalLiquidity, orderDirection: desc) {
        id
        symbol
        name
        decimals
        underlyingAsset
        isActive
        isFrozen
        liquidityRate
        variableBorrowRate
        stableBorrowRate
        totalLiquidity
        totalCurrentVariableDebt
        reserveLiquidationThreshold
        reserveLiquidationBonus
        reserveFactor
        baseLTVasCollateral
        usageAsCollateralEnabled
        borrowingEnabled
        stableBorrowRateEnabled
        lastUpdateTimestamp
      }
    }
  `;
  const data = await querySubgraph(query, {}, apiKey);
  return data['reserves'];
}

export async function getUserPositions(userAddress: string, apiKey?: string) {
  const query = `
    query GetUserPositions($user: String!) {
      userReserves(
        where: { user: $user }
        first: 100
      ) {
        id
        scaledATokenBalance
        currentATokenBalance
        currentVariableDebt
        currentStableDebt
        stableBorrowRate
        liquidityRate
        principalStableDebt
        scaledVariableDebt
        stableBorrowLastUpdateTimestamp
        usageAsCollateralEnabledOnUser
        reserve {
          id
          symbol
          name
          decimals
          underlyingAsset
          liquidityRate
          variableBorrowRate
          stableBorrowRate
        }
        user {
          id
        }
      }
    }
  `;
  const data = await querySubgraph(
    query,
    { user: userAddress.toLowerCase() },
    apiKey
  );
  return data['userReserves'];
}

export async function getProtocolStats(apiKey?: string) {
  const query = `
    query GetProtocolStats {
      reserves(first: 100) {
        totalLiquidity
        totalCurrentVariableDebt
        totalPrincipalStableDebt
        liquidityRate
        variableBorrowRate
        isActive
      }
    }
  `;
  const data = await querySubgraph(query, {}, apiKey);
  const reserves = data['reserves'] as Array<{
    totalLiquidity: string;
    totalCurrentVariableDebt: string;
    totalPrincipalStableDebt: string;
    isActive: boolean;
  }>;

  let totalLiquidity = BigInt(0);
  let totalVariableDebt = BigInt(0);
  let totalStableDebt = BigInt(0);
  let activeReserves = 0;

  for (const r of reserves) {
    try {
      totalLiquidity += BigInt(r.totalLiquidity || '0');
      totalVariableDebt += BigInt(r.totalCurrentVariableDebt || '0');
      totalStableDebt += BigInt(r.totalPrincipalStableDebt || '0');
      if (r.isActive) activeReserves++;
    } catch {
      // skip malformed entries
    }
  }

  return {
    totalReserves: reserves.length,
    activeReserves,
    totalLiquidityRaw: totalLiquidity.toString(),
    totalVariableDebtRaw: totalVariableDebt.toString(),
    totalStableDebtRaw: totalStableDebt.toString(),
    totalBorrowedRaw: (totalVariableDebt + totalStableDebt).toString(),
    reserves,
  };
}

export async function getMarketRates(
  assetSymbolOrAddress: string,
  apiKey?: string
) {
  const isAddress =
    assetSymbolOrAddress.startsWith('0x') &&
    assetSymbolOrAddress.length === 42;

  const query = isAddress
    ? `
      query GetMarketRatesByAddress($asset: String!) {
        reserves(where: { underlyingAsset: $asset }) {
          id
          symbol
          name
          underlyingAsset
          decimals
          liquidityRate
          variableBorrowRate
          stableBorrowRate
          totalLiquidity
          totalCurrentVariableDebt
          baseLTVasCollateral
          reserveLiquidationThreshold
          isActive
          isFrozen
          borrowingEnabled
          lastUpdateTimestamp
        }
      }
    `
    : `
      query GetMarketRatesBySymbol($symbol: String!) {
        reserves(where: { symbol: $symbol }) {
          id
          symbol
          name
          underlyingAsset
          decimals
          liquidityRate
          variableBorrowRate
          stableBorrowRate
          totalLiquidity
          totalCurrentVariableDebt
          baseLTVasCollateral
          reserveLiquidationThreshold
          isActive
          isFrozen
          borrowingEnabled
          lastUpdateTimestamp
        }
      }
    `;

  const variables = isAddress
    ? { asset: assetSymbolOrAddress.toLowerCase() }
    : { symbol: assetSymbolOrAddress.toUpperCase() };

  const data = await querySubgraph(query, variables, apiKey);
  const reserves = data['reserves'] as Array<{
    liquidityRate: string;
    variableBorrowRate: string;
    stableBorrowRate: string;
  }>;

  // Annotate with human-readable APY (ray = 1e27)
  const RAY = 1e27;
  return reserves.map((r) => ({
    ...r,
    supplyAPY: (Number(r.liquidityRate) / RAY) * 100,
    variableBorrowAPY: (Number(r.variableBorrowRate) / RAY) * 100,
    stableBorrowAPY: (Number(r.stableBorrowRate) / RAY) * 100,
  }));
}

export async function getRateHistory(
  reserveId: string,
  fromTimestamp: number,
  resolutionInHours = 24
) {
  const response = await httpClient.sendRequest<
    Array<{
      timestamp: number;
      liquidityRate_avg: number;
      variableBorrowRate_avg: number;
      stableBorrowRate_avg: number;
      utilizationRate_avg: number;
      x: { year: number; month: number; date: number; hours: number };
    }>
  >({
    method: HttpMethod.GET,
    url: AAVE_RATES_API,
    queryParams: {
      reserveId,
      from: fromTimestamp.toString(),
      resolutionInHours: resolutionInHours.toString(),
    },
  });

  return response.body;
}
