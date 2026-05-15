import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  HttpRequest,
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

interface X402PaymentRequired {
  maxAmountRequired: number;
  asset: string;
  payTo: string;
  network: string;
  scheme: string;
  extra?: {
    decimals?: number;
    computeUnits?: number;
    mint?: string;
  };
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

    let response = await httpClient.sendRequest(request);

    // Handle 402 Payment Required
    if (response.status === 402) {
      const paymentRequired: X402PaymentRequired = response.body;

      if (paymentRequired.maxAmountRequired > maxPrice) {
        throw new Error(
          `Payment required (${paymentRequired.maxAmountRequired} USDC) exceeds maximum price (${maxPrice} USDC)`
        );
      }

      const usdcMintPubkey = new PublicKey(
        paymentRequired.extra?.mint || 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
      );
      const decimals = paymentRequired.extra?.decimals ?? 6;

      // Build signed payment envelope (do NOT broadcast)
      const paymentEnvelope = await buildSignedPaymentEnvelope(
        connection,
        keypair,
        paymentRequired,
        usdcMintPubkey,
        decimals
      );

      // Retry request with X-Payment header (server verifies and submits)
      const paymentHeader = Buffer.from(JSON.stringify(paymentEnvelope)).toString('base64');
      request.headers = {
        ...headers,
        'X-Payment': paymentHeader,
      };

      response = await httpClient.sendRequest(request);
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
  paymentRequired: X402PaymentRequired,
  usdcMint: PublicKey,
  decimals: number
): Promise<{ transaction: string; signature: string; network: string }> {
  // Derive sender's Associated Token Account for USDC
  const senderAta = getAssociatedTokenAddressSync(
    usdcMint,
    keypair.publicKey
  );

  // Derive recipient's Associated Token Account for USDC
  const recipientWallet = new PublicKey(paymentRequired.payTo);
  const recipientAta = getAssociatedTokenAddressSync(
    usdcMint,
    recipientWallet
  );

  // Use raw integer amount to avoid floating-point rounding issues
  const rawAmount = BigInt(
    Math.round(paymentRequired.maxAmountRequired * Math.pow(10, decimals))
  );

  const { blockhash } = await connection.getLatestBlockhash();

  const transaction = new Transaction()
    .setRecentBlockhash(blockhash)
    .add(
      createTransferCheckedInstruction(
        senderAta,     // from: sender's USDC token account (ATA)
        usdcMint,      // mint: USDC mint address
        recipientAta,  // to: recipient's USDC token account (ATA)
        keypair.publicKey,
        rawAmount,     // amount: raw integer with decimals
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
    network: paymentRequired.network,
  };
}
