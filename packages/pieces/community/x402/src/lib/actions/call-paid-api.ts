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
  createTransferInstruction,
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

interface X402PaymentEnvelope {
  transaction: string;
  signature: string;
  network: string;
}

export const callPaidApi = createAction({
  name: 'call_paid_api',
  auth: x402Auth,
  displayName: 'Call Paid API with x402',
  description: 'Call an API endpoint that requires x402 payment',
  props: {
    url: Property.ShortText({
      displayName: 'API Endpoint URL',
      description: 'The URL of the paid API endpoint',
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
      description: 'Maximum amount in USDC you are willing to pay',
      required: true,
    }),
  },
  async run({ propsValue, auth }) {
    const { url, method, headers, body, maxPrice } = propsValue;
    const { privateKey, network } = auth;

    // Initialize connection based on network
    const rpcUrl = network === 'mainnet-beta'
      ? 'https://api.mainnet-beta.solana.com'
      : network === 'devnet'
      ? 'https://api.devnet.solana.com'
      : 'https://api.testnet.solana.com';

    const connection = new Connection(rpcUrl, 'confirmed');

    // Load wallet from private key
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

      // Validate payment requirements
      if (paymentRequired.maxAmountRequired > maxPrice) {
        throw new Error(
          `Payment required (${paymentRequired.maxAmountRequired} USDC) exceeds maximum price (${maxPrice} USDC)`
        );
      }

      // For now, we only support mainnet USDC
      const usdcMint = paymentRequired.extra?.mint || 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

      // Build payment transaction
      const paymentEnvelope = await buildAndSendPayment(
        connection,
        keypair,
        paymentRequired,
        usdcMint
      );

      // Retry request with X-Payment header
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
      paymentInfo: response.status === 200 ? {
        paid: true,
        transaction: 'Payment successful',
      } : null,
    };
  },
});

async function buildAndSendPayment(
  connection: Connection,
  keypair: Keypair,
  paymentRequired: X402PaymentRequired,
  usdcMint: string
): Promise<X402PaymentEnvelope> {
  try {
    // For USDC transfers, we use SPL Token
    const amount = paymentRequired.maxAmountRequired * Math.pow(10, paymentRequired.extra?.decimals || 6);

    // Get token accounts
    const fromTokenAccount = await connection.getTokenAccountsByOwner(
      keypair.publicKey,
      { mint: usdcMint }
    );

    if (fromTokenAccount.value.length === 0) {
      throw new Error('No USDC token account found. Please create a token account first.');
    }

    const fromAddress = fromTokenAccount.value[0].pubkey;
    const toAddress = new PublicKey(paymentRequired.payTo);

    // Create transfer instruction
    const transaction = new Transaction().add(
      createTransferInstruction(
        fromAddress,
        toAddress,
        keypair.publicKey,
        amount
      )
    );

    // Send and confirm transaction
    const signature = await connection.sendTransaction(transaction, [keypair]);
    await connection.confirmTransaction(signature, 'confirmed');

    return {
      transaction: signature,
      signature,
      network: paymentRequired.network,
    };
  } catch (error) {
    throw new Error(`Failed to process payment: ${error}`);
  }
}
