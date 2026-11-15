import { AppConnectionType } from '@activepieces/core-piece-types';
import { describe, expect, it } from 'vitest';
import { PropertyType } from '../src/lib/property/input/property-type';
import { getAuthPropertyForValue, PieceAuth } from '../src/lib/property';

const secretText = () => PieceAuth.SecretText({ displayName: 'Token', required: true });

const oauth2 = () =>
  PieceAuth.OAuth2({
    displayName: 'Auth',
    authUrl: 'https://example.com/authorize',
    tokenUrl: 'https://example.com/token',
    required: true,
    scope: [],
  });

describe('getAuthPropertyForValue', () => {
  it('returns a single auth property untouched, whatever the connection type', () => {
    const auth = secretText();
    expect(getAuthPropertyForValue({ authValueType: AppConnectionType.CLOUD_OAUTH2, pieceAuth: auth })).toBe(auth);
  });

  it('maps every OAuth2 connection type onto the OAuth2 auth entry', () => {
    const pieceAuth = [secretText(), oauth2()];
    const oauthTypes = [
      AppConnectionType.OAUTH2,
      AppConnectionType.CLOUD_OAUTH2,
      AppConnectionType.PLATFORM_OAUTH2,
    ];
    for (const authValueType of oauthTypes) {
      expect(getAuthPropertyForValue({ authValueType, pieceAuth })?.type).toBe(PropertyType.OAUTH2);
    }
  });

  it('matches the secret-text entry for a secret-text connection', () => {
    const pieceAuth = [oauth2(), secretText()];
    expect(getAuthPropertyForValue({ authValueType: AppConnectionType.SECRET_TEXT, pieceAuth })?.type)
      .toBe(PropertyType.SECRET_TEXT);
  });
});
