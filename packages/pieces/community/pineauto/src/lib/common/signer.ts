import { getPublicKeyAsync, signAsync } from '@noble/ed25519';
import { encodeBase58 } from 'ethers';
import bs58 from 'bs58';

export async function signAndSendRequest(
  orderlyAccountId: string,
  privateKey: Uint8Array | string,
  input: URL | string,
  init?: RequestInit | undefined
): Promise<Response> {
  const timestamp = Date.now();
  const encoder = new TextEncoder();
  const url = new URL(input);
  
  // privateKey를 Uint8Array로 변환
  let privateKeyBytes: Uint8Array;
  if (typeof privateKey === 'string') {
    // Base58 인코딩된 문자열인 경우 디코딩
    try {
      privateKeyBytes = bs58.decode(privateKey);
    } catch (error) {
      throw new Error('Invalid private key format. Expected Base58 encoded string or Uint8Array');
    }
  } else {
    privateKeyBytes = privateKey;
  }
  
  // 메시지 생성 (Orderly 서명 포맷)
  let message = `${String(timestamp)}${init?.method ?? 'GET'}${url.pathname}${url.search}`;
  if (init?.body) {
    message += init.body;
  }
  
  // Ed25519 서명 생성
  const orderlySignature = await signAsync(encoder.encode(message), privateKeyBytes);
  
  // Public key 가져오기
  const publicKey = await getPublicKeyAsync(privateKeyBytes);
  
  // 헤더 생성
  const headers = {
    'Content-Type':
      init?.method !== 'GET' && init?.method !== 'DELETE'
        ? 'application/json'
        : 'application/x-www-form-urlencoded',
    'orderly-timestamp': String(timestamp),
    'orderly-account-id': orderlyAccountId,
    'orderly-key': `ed25519:${encodeBase58(publicKey)}`,
    'orderly-signature': Buffer.from(orderlySignature).toString('base64url'),
    ...(init?.headers ?? {})
  };
  
  return fetch(input, {
    ...init,
    headers
  });
}