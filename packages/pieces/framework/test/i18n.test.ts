import { LocalesEnum } from '@activepieces/core-utils';
import { PackageType, PieceType } from '@activepieces/core-piece-types';
import { describe, expect, it } from 'vitest';
import { pieceTranslation } from '../src/lib/i18n';
import { PieceMetadataModelSummary } from '../src/lib/piece-metadata';
import { PieceAuth, Property } from '../src/lib/property';

describe('pieceTranslation', () => {
  it('translates properties in every auth entry', () => {
    const piece: PieceMetadataModelSummary = {
      name: 'multi-auth-piece',
      displayName: 'Multi auth piece',
      logoUrl: 'https://example.com/logo.png',
      description: 'A piece with multiple authentication methods',
      authors: [],
      version: '1.0.0',
      actions: 0,
      triggers: 0,
      projectUsage: 0,
      pieceType: PieceType.OFFICIAL,
      packageType: PackageType.REGISTRY,
      contextInfo: undefined,
      auth: [
        PieceAuth.BasicAuth({
          description: 'Basic authentication',
          required: true,
          username: {
            displayName: 'Username',
            description: 'The account username',
          },
          password: {
            displayName: 'Password',
            description: 'The account password',
          },
        }),
        PieceAuth.CustomAuth({
          displayName: 'Custom connection',
          description: 'Custom authentication',
          required: true,
          props: {
            apiKey: Property.ShortText({
              displayName: 'API key',
              description: 'The API key for this connection',
              required: true,
            }),
          },
        }),
      ],
      i18n: {
        [LocalesEnum.FRENCH]: {
          'Basic authentication': 'Authentification de base',
          Username: 'Nom d’utilisateur',
          'The account username': 'Le nom d’utilisateur du compte',
          Password: 'Mot de passe',
          'The account password': 'Le mot de passe du compte',
          'Custom authentication': 'Authentification personnalisée',
          'API key': 'Clé API',
          'The API key for this connection': 'La clé API de cette connexion',
        },
      },
    };

    const translated = pieceTranslation.translatePiece({
      piece,
      locale: LocalesEnum.FRENCH,
    });

    expect(translated.auth).toMatchObject([
      {
        description: 'Authentification de base',
        username: {
          displayName: 'Nom d’utilisateur',
          description: 'Le nom d’utilisateur du compte',
        },
        password: {
          displayName: 'Mot de passe',
          description: 'Le mot de passe du compte',
        },
      },
      {
        description: 'Authentification personnalisée',
        props: {
          apiKey: {
            displayName: 'Clé API',
            description: 'La clé API de cette connexion',
          },
        },
      },
    ]);
  });
});
