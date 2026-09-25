import { AconexAuthError } from './errors';

export const PRODUCTION_LOBBY = 'https://constructionandengineering.oraclecloud.com';
export const EA_LOBBY = 'https://constructionandengineering-ea.oraclecloud.com';
export const EA_SITE = 'https://ea1.aconex.com';

export const COMMERCIAL_SITES = [
  'https://asia1.aconex.com',
  'https://asia2.aconex.com',
  'https://au1.aconex.com',
  'https://ca1.aconex.com',
  'https://eu1.aconex.com',
  'https://ksa1.aconex.com',
  'https://mea.aconex.com',
  'https://uk1.aconex.co.uk',
  'https://us1.aconex.com',
] as const;

const ALLOWED_SITES = new Set<string>([...COMMERCIAL_SITES, EA_SITE]);

export type AconexAuthProps = {
  lobby: string;
  clientId: string;
  clientSecret: string;
  userId?: string;
  userSite?: string;
};

export function readAuth(input: unknown): AconexAuthProps {
  if (input && typeof input === 'object' && 'props' in input) {
    const props = (input as { props?: Partial<AconexAuthProps> }).props;
    if (props?.clientId) {
      return props as AconexAuthProps;
    }
  }
  return input as AconexAuthProps;
}

export function assertAuthProps(input: AconexAuthProps): AconexAuthProps {
  const lobby = blankToUndefined(input?.lobby);
  const clientId = blankToUndefined(input?.clientId);
  const clientSecret = typeof input?.clientSecret === 'string' ? input.clientSecret : '';
  const userId = blankToUndefined(input?.userId);
  const userSite = blankToUndefined(input?.userSite);

  if (lobby !== PRODUCTION_LOBBY && lobby !== EA_LOBBY) {
    throw new AconexAuthError('INVALID_LOBBY', 'Choose the commercial production Lobby or the Early Access Lobby.');
  }
  if (!clientId || clientSecret.length === 0) {
    throw new AconexAuthError('INVALID_CLIENT', 'Client id and client secret are required.');
  }
  if ((userId && !userSite) || (!userId && userSite)) {
    throw new AconexAuthError(
      'INVALID_USER_BINDING',
      'Set both Aconex user id and instance, or leave both empty.',
    );
  }
  if (userId && !/^[0-9]+$/.test(userId)) {
    throw new AconexAuthError('INVALID_USER_ID', 'Aconex user id must be digits only.');
  }
  if (userSite && !ALLOWED_SITES.has(userSite)) {
    throw new AconexAuthError('INVALID_USER_SITE', 'Choose an Aconex instance from the list.');
  }
  if (lobby === EA_LOBBY && userSite && userSite !== EA_SITE) {
    throw new AconexAuthError(
      'LOBBY_SITE_MISMATCH',
      'The Early Access Lobby only works with https://ea1.aconex.com.',
    );
  }
  if (lobby === PRODUCTION_LOBBY && userSite === EA_SITE) {
    throw new AconexAuthError(
      'LOBBY_SITE_MISMATCH',
      'The production Lobby does not use https://ea1.aconex.com.',
    );
  }
  return { lobby, clientId, clientSecret, userId, userSite };
}

function blankToUndefined(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}
