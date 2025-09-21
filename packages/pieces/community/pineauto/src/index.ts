import { createPiece, PieceAuth, Property } from "@activepieces/pieces-framework";
import bs58 from 'bs58';
import { signAndSendRequest } from './lib/common/signer';
import { createOrder } from './lib/actions/create-order';
import { tradingviewwebhook } from "./lib/triggers/tradingviewwebhook";
// 다른 actions import...

// Auth 타입 정의 export
export type PineautoAuthType = {
  environment: 'mainnet' | 'testnet';
  account_id: string;
  public_key: string;
  secret_key: string;
};

export const pineautoauth = PieceAuth.CustomAuth({
  description: 'PineAuto 의 api key 를 입력하세요.',
  props: {
    environment: Property.StaticDropdown({
      displayName: 'Environment',
      description: 'Select Orderly Network environment',
      required: true,
      defaultValue: 'testnet',
      options: {
        options: [
          { label: 'Mainnet', value: 'mainnet' },
          { label: 'Testnet', value: 'testnet' },
        ]
      }
    }),
    account_id: Property.ShortText({
      displayName: 'Account ID',
      description: 'Your Orderly account ID (e.g., 0x1234...)',
      required: true,
    }),
    public_key: PieceAuth.SecretText({
      displayName: 'Public Key',
      description: 'Your Orderly public key',
      required: true
    }),
    secret_key: PieceAuth.SecretText({
      displayName: 'Secret Key',
      description: 'Your Orderly secret key (Base58 encoded)',
      required: true
    })
  },
  validate: async ({ auth }) => {
    try {
      const typedAuth = auth as PineautoAuthType;
      // Base58 디코딩
      const privateKey = bs58.decode(typedAuth.secret_key);
      
      // API 엔드포인트 결정
      const baseUrl = typedAuth.environment === 'mainnet' 
        ? 'https://api.orderly.org' 
        : 'https://testnet-api.orderly.org';
      
      // 계정 정보 확인으로 검증
      const response = await signAndSendRequest(
        typedAuth.account_id,
        privateKey,
        `${baseUrl}/v1/client/info`,
        { method: 'GET' }
      );
      
      if (response.ok) {
        return { valid: true };
      } else {
        const error = await response.text();
        return { 
          valid: false, 
          error: `Authentication failed: ${error}` 
        };
      }
    } catch (error) {
      return { 
        valid: false, 
        error: `Invalid credentials: ${error}` 
      };
    }
  },
  required: true
});

export const pineauto = createPiece({
  displayName: "Pineauto",
  auth: pineautoauth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://logo.pineauto.app/Pavicon.png",
  authors: ["hoddukzoa"],
  actions: [createOrder], // action 추가
  triggers: [tradingviewwebhook],
});