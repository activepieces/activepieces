import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import * as crypto from 'crypto';

export interface CashgramAuthCredentials {
  clientId: string;
  clientSecret: string;
  publicKey: string;
}

export interface CashgramTokenResponse {
  success: boolean;
  token?: string;
  error?: any;
  message?: string;
}

/**
 * Generate x-cf-signature using client ID and public key
 * Based on Cashfree's Java implementation: RSA/ECB/OAEPWithSHA-1AndMGF1Padding
 */
export function generateCfSignature(clientId: string, publicKey: string): { signature: string, timestamp: number } {
  try {
    const timestamp = Math.floor(Date.now() / 1000); // Current UNIX timestamp
    const data = `${clientId}.${timestamp}`;

    // Parse the public key exactly like the Java code
    let publicKeyContent = (publicKey).trim();

    // Remove all whitespace and header/footer like Java code
    publicKeyContent = publicKeyContent
      .replace(/[\t\n\r]/g, '') // Remove tabs, newlines, carriage returns
      .replace('-----BEGIN PUBLIC KEY-----', '')
      .replace('-----END PUBLIC KEY-----', '');

    console.log(`Cleaned public key content length: ${publicKeyContent.length}`);

    // Convert to DER format (what the Java X509EncodedKeySpec expects)
    const keyBuffer = Buffer.from(publicKeyContent, 'base64');

    // Create the key object for Node.js crypto
    // Node.js crypto.publicEncrypt with OAEP padding matches Java's RSA/ECB/OAEPWithSHA-1AndMGF1Padding
    const keyObject = {
      key: Buffer.concat([
        Buffer.from('-----BEGIN PUBLIC KEY-----\n'),
        Buffer.from(publicKeyContent.match(/.{1,64}/g)?.join('\n') || publicKeyContent),
        Buffer.from('\n-----END PUBLIC KEY-----')
      ]).toString(),
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, // This matches OAEP padding in Java
      oaepHash: 'sha1' // This matches SHA-1 in Java
    };

    // Encrypt the data (this matches cipher.doFinal() in Java)
    const dataBuffer = Buffer.from(data, 'utf8');
    const encrypted = crypto.publicEncrypt(keyObject, dataBuffer);

    // Base64 encode the result (matches Base64.getEncoder().encodeToString() in Java)
    const signature = encrypted.toString('base64');

    console.log(`Generated signature for data: ${data}`);
    console.log(`Signature: ${signature}`);
    console.log(`Signature length: ${signature.length}`);

    return { signature, timestamp };

  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error generating signature: ${error.message}`);
      console.error(`Public key format check - starts with BEGIN: ${publicKey.includes('BEGIN')}`);
      console.error(`Public key length: ${publicKey.length}`);
      throw new Error(`Failed to generate signature: ${error.message}. Please verify your public key is in proper PEM format.`);
    } else {
      console.error("Error generating signature: Unknown error");
      throw new Error("Failed to generate signature: Unknown error. Please verify your public key is in proper PEM format.");
    }
  }
}

/**
 * Generate bearer token for Cashgram operations using client credentials and public key
 *
 * This implementation uses crypto to generate the proper x-cf-signature.
 */
export async function generateCashgramToken(
  credentials: CashgramAuthCredentials,
  environment: 'sandbox' | 'production'
): Promise<CashgramTokenResponse> {
  try {
    const baseUrl = environment === 'production'
      ? 'https://payout-api.cashfree.com/payout/v1/authorize'
      : 'https://payout-gamma.cashfree.com/payout/v1/authorize';

    // Generate x-cf-signature using crypto
    // let signature: string;
    // let timestamp: number;

    // try {
    //   const sigResult = generateCfSignature(credentials.clientId, credentials.publicKey);
    //   signature = sigResult.signature;
    //   timestamp = sigResult.timestamp;
    // } catch (signatureError: any) {
    //   console.error('Signature generation error:', signatureError);
    //   return {
    //     success: false,
    //     error: signatureError,
    //     message: `Failed to generate x-cf-signature: ${signatureError?.message || 'Unknown error'}. Please check your public key format.`,
    //   };
    // }

    // Build headers with the generated signature and timestamp
    const headers = {
      'x-client-id': credentials.clientId,
      'x-client-secret': credentials.clientSecret,
      // 'x-cf-signature': signature,
      // 'x-cf-timestamp': timestamp.toString(),
      'Content-Type': 'application/json',
    };

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: baseUrl,
      headers: headers,
      body: {},
    });
    
    if (response.status === 200 && response.body?.data?.token) {
      return {
        success: true,
        token: response.body.data.token,
        message: 'Bearer token generated successfully',
      };
    } else {
      return {
        success: false,
        error: response.body,
        message: `Failed to generate bearer token. Status: ${response.status}. Response: ${JSON.stringify(response.body)}`,
      };
    }
  } catch (error) {
    console.error('Error generating Cashgram token:', error);
    return {
      success: false,
      error: error,
      message: 'An error occurred while generating the bearer token',
    };
  }
}

/**
 * Validate authentication credentials based on auth type
 */
export function validateAuthCredentials(authType: string, credentials: {
  clientId?: string;
  clientSecret?: string;
  publicKey?: string;
}): {
  isValid: boolean;
  error?: string;
} {
  if (authType === 'client_credentials') {
    if (!credentials.clientId || (credentials.clientId).trim().length === 0) {
      return {
        isValid: false,
        error: 'Client ID is required for Client Credentials authentication',
      };
    }

    if (!credentials.clientSecret || (credentials.clientSecret).trim().length === 0) {
      return {
        isValid: false,
        error: 'Client Secret is required for Client Credentials authentication',
      };
    }
  } else if (authType === 'client_credentials_with_public_key') {
    if (!credentials.clientId || (credentials.clientId).trim().length === 0) {
      return {
        isValid: false,
        error: 'Client ID is required for Client Credentials + Public Key authentication',
      };
    }

    if (!credentials.clientSecret || (credentials.clientSecret).trim().length === 0) {
      return {
        isValid: false,
        error: 'Client Secret is required for Client Credentials + Public Key authentication',
      };
    }

    if (!credentials.publicKey || (credentials.publicKey).trim().length === 0) {
      return {
        isValid: false,
        error: 'Public Key is required for Client Credentials + Public Key authentication',
      };
    }

    // // Basic validation for PEM format
    // if (!credentials.publicKey.includes('-----BEGIN') || !credentials.publicKey.includes('-----END')) {
    //   return {
    //     isValid: false,
    //     error: 'Public Key must be in PEM format (including BEGIN/END markers)',
    //   };
    // }
  }

  return {
    isValid: true,
  };
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use validateAuthCredentials instead
 */
export function validateCashgramCredentials(credentials: CashgramAuthCredentials): {
  isValid: boolean;
  error?: string;
} {
  return validateAuthCredentials('client_credentials_with_public_key', credentials);
}
