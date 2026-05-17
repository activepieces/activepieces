import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  HttpRequest,
  HttpError,
} from '@activepieces/pieces-common';
import { x402Auth } from '../auth';
import {
  Connection,
  Keypair,
  Transaction,
  PublicKey,
} from '@solana/web3.js';
import * as bs58 from 'bs58';
import {
  createTransferCheckedInstruction,
  getAssociatedTokenAddressSync,
} from '@solana/spl-token';

// Known USDC mint addresses for Solana networks
const USDC_MINTS = {
  'mainnet-beta': 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  'devnet': '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
  'testnet': '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
} as const;

interface X402PaymentRequirement {
  scheme: string;
  price: number | string;
  network: string;
  payTo: string;
  asset?: string;
  extra?: {
    decimals?: number;
    computeUnits?: number;
    mint?: string;
  };
}

interface X402PaymentRequired {
  // V2 format: accepts[] array of payment options
  accepts?: X402PaymentRequirement[];
  // V1 format: top-level fields (backward compatibility)
  maxAmountRequired?: number | string;
  asset?: string;
  payTo?: string;
  network?: string;
  scheme?: string;
  extra?: {
    decimals?: number;
    computeUnits?: number;
    mint?: string;
  };
}

/**
 * Parse x402 V2 accepts[] array or fall back to V1 top-level fields.
 * Selects a Solana payment requirement compatible with the configured network.
 */
function parsePaymentRequirement(
  paymentRequired: X402PaymentRequired,
  configuredNetwork: string
): X402PaymentRequirement {
  // V2 format: accepts[] array
  if (paymentRequired.accepts && paymentRequired.accepts.length > 0) {
    // Filter for Solana requirements matching the configured network.
    // x402 V2 uses CAIP-2 network IDs (e.g., "solana:mainnet-beta"),
    // V1 may use simple names (e.g., "mainnet-beta").
    // scheme is "exact"/"upto"/"batch-settlement", NOT "solana".
    const solanaRequirements = paymentRequired.accepts.filter(
      (req) => {
        const net = (req.network || '').toLowerCase();
        const isSolana = net.includes('solana') ||
          net === configuredNetwork ||
          net === `solana:${configuredNetwork}`;
        const hasValidScheme = ['exact', 'upto', 'batch-settlement', 'solana'].includes(req.scheme || '');
        return isSolana && hasValidScheme;
      }
    );

    if (solanaRequirements.length === 0) {
      throw new Error(
        `No compatible Solana payment requirement found for network '${configuredNetwork}'. Available options: ${paymentRequired.accepts.map((req) => req.network).join(', ')}`
      );
    }

    // Use the first matching requirement
    return solanaRequirements[0];
  }

  // V1 format: top-level fields (backward compatibility)
  if (
    paymentRequired.maxAmountRequired &&
    paymentRequired.payTo &&
    paymentRequired.network &&
    paymentRequired.scheme
  ) {
    return {
      scheme: paymentRequired.scheme,
      price: paymentRequired.maxAmountRequired,
      network: paymentRequired.network,
      payTo: paymentRequired.payTo,
      asset: paymentRequired.asset,
      extra: paymentRequired.extra,
    };
  }

  throw new Error(
    'Invalid x402 payment response: missing payment requirement details. Expected accepts[] (V2) or top-level fields (V1).'
  );
}

export const callPaidApi = createAction({
  name: 'call_paid_api',
  auth: x402Auth,
  displayName: 'Call Paid API with x402',
  description: 'Call an API endpoint that requires x402 payment. Uses the x402 open protocol — pay per API call with on-chain USDC.',
  props: {
    url: Property.ShortText({
      displayName: 'API Endpoint URL',
      description: 'The URL of the paid API endpoint (must implement x402 protocol)',
      required: true,
    }),
    method: Property.StaticDropdown({
      displayName: 'HTTP Method',
      description: 'The HTTP method to use',
      required: true,
      options: {
        options: [
          { label: 'GET', value: 'GET' },
          { label: 'POST', value: 'POST' },
          { label: 'PUT', value: 'PUT' },
          { label: 'PATCH', value: 'PATCH' },
          { label: 'DELETE', value: 'DELETE' },
        ],
        defaultValue: 'GET',
      },
    }),
    headers: Property.Object({
      displayName: 'Headers',
      description: 'Optional HTTP headers',
      required: false,
    }),
    body: Property.Object({
      displayName: 'Request Body',
      description: 'Optional request body (for POST, PUT, PATCH)',
      required: false,
    }),
    maxPrice: Property.Number({
      displayName: 'Maximum Price (USDC)',
      description: 'Maximum amount in USDC you are willing to pay per call',
      required: true,
    }),
  },
  async run({ propsValue, auth }) {
    const { url, method, headers, body, maxPrice } = propsValue;
    const { privateKey, network } = auth;

    const rpcUrl = network === 'mainnet-beta'
      ? 'https://api.mainnet-beta.solana.com'
      : network === 'devnet'
      ? 'https://api.devnet.solana.com'
      : 'https://api.testnet.solana.com';

    const connection = new Connection(rpcUrl, 'confirmed');
    const keypair = Keypair.fromSecretKey(bs58.decode(privateKey));

    // Initial request
    let request: HttpRequest = {
      method: method as HttpMethod,
      url,
      headers: headers || {},
    };

    if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
      request.body = body;
    }

    let response;
    try {
      response = await httpClient.sendRequest(request);
    } catch (error) {
      // Handle 402 Payment Required
      if (error instanceof HttpError && error.response.status === 402) {
        const paymentRequired: X402PaymentRequired = error.response.body;

        // Parse V2 accepts[] or V1 top-level fields
        const requirement = parsePaymentRequirement(paymentRequired, network);

        // Validate mint address against known USDC mints
        const expectedMint = USDC_MINTS[network as keyof typeof USDC_MINTS];
        const providedMint = requirement.extra?.mint || requirement.asset;
        if (providedMint && providedMint !== expectedMint) {
          throw new Error(
            `Invalid USDC mint address. Expected ${expectedMint} for ${network}, got ${providedMint}`
          );
        }

        const usdcMintPubkey = new PublicKey(expectedMint);
        const decimals = requirement.extra?.decimals ?? 6;

        // Convert maxAmountRequired to atomic units (it may be a number or string)
        const maxAmountAtomic = BigInt(requirement.price);

        // Convert user's maxPrice (USDC) to atomic units for comparison
        const maxPriceAtomic = BigInt(Math.round(maxPrice * Math.pow(10, decimals)));

        if (maxAmountAtomic > maxPriceAtomic) {
          // Convert back to USDC for user-friendly error message
          const requiredUsdc = Number(maxAmountAtomic) / Math.pow(10, decimals);
          throw new Error(
            `Payment required (${requiredUsdc.toFixed(6)} USDC) exceeds maximum price (${maxPrice} USDC)`
          );
        }

        // Build signed payment envelope (do NOT broadcast)
        const paymentEnvelope = await buildSignedPaymentEnvelope(
          connection,
          keypair,
          requirement,
          usdcMintPubkey
        );

        // Retry request with X-Payment header (server verifies and submits)
        const paymentHeader = Buffer.from(JSON.stringify(paymentEnvelope)).toString('base64');
        request.headers = {
          ...headers,
          'X-Payment': paymentHeader,
        };

        response = await httpClient.sendRequest(request);
      } else {
        throw error;
      }
    }

    return {
      status: response.status,
      headers: response.headers,
      body: response.body,
      paymentInfo: response.status === 200
        ? { paid: true }
        : { paid: false },
    };
  },
});

/**
 * Build and SIGN a Solana USDC transfer — but do NOT broadcast.
 * The x402 server receives the signed envelope, verifies it, and submits.
 * This prevents funds from being spent if the API rejects the proof.
 */
async function buildSignedPaymentEnvelope(
  connection: Connection,
  keypair: Keypair,
  requirement: X402PaymentRequirement,
  usdcMint: PublicKey
): Promise<{ transaction: string; signature: string; network: string }> {
  // Derive sender's Associated Token Account for USDC
  const senderAta = getAssociatedTokenAddressSync(
    usdcMint,
    keypair.publicKey
  );

  // Derive recipient's Associated Token Account for USDC
  const recipientWallet = new PublicKey(requirement.payTo);
  const recipientAta = getAssociatedTokenAddressSync(
    usdcMint,
    recipientWallet
  );

  // price is already in atomic units (e.g., micro-USDC), use directly
  const rawAmount = BigInt(requirement.price);
  const decimals = requirement.extra?.decimals ?? 6;

  const { blockhash } = await connection.getLatestBlockhash();

  const transaction = new Transaction()
    .setRecentBlockhash(blockhash)
    .add(
      createTransferCheckedInstruction(
        senderAta,     // from: sender's USDC token account (ATA)
        usdcMint,      // mint: USDC mint address
        recipientAta,  // to: recipient's USDC token account (ATA)
        keypair.publicKey,
        rawAmount,     // amount: raw integer in atomic units (already scaled)
        decimals       // decimals: 6 for USDC
      )
    );

  // Sign the transaction — but do NOT send it
  transaction.sign(keypair);

  // Serialize the signed transaction for the server to submit
  const serialized = transaction.serialize().toString('base64');

  return {
    transaction: serialized,
    signature: Buffer.from(transaction.signature!).toString('base64'),
    network: requirement.network,
  };
}
