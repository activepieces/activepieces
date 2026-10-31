import { SignInMethods } from '@activepieces/shared';

function domainOf(email: string): string {
  return email.trim().split('@')[1] ?? '';
}

export const signInDiscoveryUtils = { domainOf };

export type TurnedOffMethod = {
  email: string;
  method: 'email' | 'sso';
  methods: SignInMethods;
};
