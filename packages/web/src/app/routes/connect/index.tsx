import {
  PieceAuthProperty,
  PropertyType,
} from '@activepieces/pieces-framework';
import {
  ApFlagId,
  AppConnectionType,
  ConnectOAuth2App,
  isNil,
  UpsertAppConnectionRequestBody,
} from '@activepieces/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { CircleCheck, Unplug } from 'lucide-react';
import { ReactNode, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { FlagsMap } from '@/api/flags-api';
import { LoadingSpinner } from '@/components/custom/spinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthLayout } from '@/features/authentication/components/auth-form-template';
import { oauth2Utils } from '@/features/connections';
import { connectApi } from '@/features/connections/api/connect';
import { piecesApi } from '@/features/pieces/api/pieces-api';
import { PieceIcon } from '@/features/pieces/components/piece-icon';
import { flagsHooks } from '@/hooks/flags-hooks';
import { cn } from '@/lib/utils';

const CLOUD_REDIRECT_URL = 'https://secrets.activepieces.com/redirect';

const SUPPORTED_AUTH_TYPES: PropertyType[] = [
  PropertyType.SECRET_TEXT,
  PropertyType.BASIC_AUTH,
  PropertyType.CUSTOM_AUTH,
  PropertyType.OAUTH2,
];

const ConnectPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const queryClient = useQueryClient();

  const { data: thirdPartyRedirectUrl } = flagsHooks.useFlag<string>(
    ApFlagId.THIRD_PARTY_AUTH_PROVIDER_REDIRECT_URL,
  );

  const {
    data: context,
    isLoading: isExchanging,
    isError: tokenError,
  } = useQuery({
    queryKey: ['connect-exchange', token],
    queryFn: async () => {
      const result = await connectApi.exchange(token);
      queryClient.setQueryData<FlagsMap>(flagsHooks.queryKey, (previous) =>
        previous ? { ...previous, [ApFlagId.THEME]: result.theme } : previous,
      );
      return result;
    },
    enabled: token.length > 0,
    retry: false,
  });

  const { data: piece, isLoading: isLoadingPiece } = useQuery({
    queryKey: ['connect-piece', context?.pieceName],
    queryFn: () => piecesApi.get({ name: context!.pieceName }),
    enabled: !isNil(context?.pieceName),
  });

  if (token.length === 0 || tokenError) {
    return (
      <AuthLayout>
        <StatusHeader
          variant="destructive"
          icon={<Unplug className="size-6" />}
          title={t('Invalid link')}
          subtitle={t('This connection link is invalid or has expired.')}
        />
      </AuthLayout>
    );
  }

  if (isExchanging || isLoadingPiece || isNil(context) || isNil(piece)) {
    return (
      <AuthLayout>
        <div className="flex justify-center">
          <LoadingSpinner className="size-10" />
        </div>
      </AuthLayout>
    );
  }

  const auth = Array.isArray(piece.auth) ? piece.auth[0] : piece.auth;

  return (
    <AuthLayout>
      <ConnectForm
        token={token}
        pieceDisplayName={piece.displayName}
        pieceLogoUrl={piece.logoUrl}
        auth={auth}
        pieceName={context.pieceName}
        externalId={context.externalId}
        displayName={context.displayName}
        projectId={context.projectId}
        oauth2App={context.oauth2App}
        thirdPartyRedirectUrl={thirdPartyRedirectUrl ?? null}
      />
    </AuthLayout>
  );
};

type ConnectFormProps = {
  token: string;
  pieceDisplayName: string;
  pieceLogoUrl: string;
  auth: PieceAuthProperty | undefined;
  pieceName: string;
  externalId: string;
  displayName: string | null;
  projectId: string;
  oauth2App: ConnectOAuth2App | null;
  thirdPartyRedirectUrl: string | null;
};

const ConnectForm = ({
  token,
  pieceDisplayName,
  pieceLogoUrl,
  auth,
  pieceName,
  externalId,
  displayName,
  projectId,
  oauth2App,
  thirdPartyRedirectUrl,
}: ConnectFormProps) => {
  const [fields, setFields] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      setErrorMessage(null);
      if (isNil(auth)) {
        throw new Error('Unsupported authentication type');
      }
      const connection = await buildConnection({
        auth,
        fields,
        token,
        oauth2App,
        thirdPartyRedirectUrl,
        base: {
          externalId,
          displayName: displayName ?? externalId,
          pieceName,
          projectId,
        },
      });
      await connectApi.save({ token, connection });
    },
    onSuccess: () => setDone(true),
    onError: (error) =>
      setErrorMessage(
        error instanceof Error ? error.message : t('Failed to connect'),
      ),
  });

  if (done) {
    return (
      <StatusHeader
        variant="success"
        icon={<CircleCheck className="size-6" />}
        title={t('You’re connected')}
        subtitle={t('You can close this window and return to the app.')}
      />
    );
  }

  if (isNil(auth) || !SUPPORTED_AUTH_TYPES.includes(auth.type)) {
    return (
      <PieceHeader
        logoUrl={pieceLogoUrl}
        displayName={pieceDisplayName}
        title={pieceDisplayName}
        subtitle={t(
          'This authentication type is not supported on the hosted page yet.',
        )}
      />
    );
  }

  const oauth2Type = oauth2App?.oauth2Type ?? AppConnectionType.OAUTH2;

  const setField = (key: string, value: string) =>
    setFields((previous) => ({ ...previous, [key]: value }));

  return (
    <>
      <PieceHeader
        logoUrl={pieceLogoUrl}
        displayName={pieceDisplayName}
        title={t('Connect to {displayName}', { displayName: pieceDisplayName })}
        subtitle={t('Authorize access to your {displayName} account.', {
          displayName: pieceDisplayName,
        })}
      />
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3">
          {auth.type === PropertyType.SECRET_TEXT && (
            <Field
              label={auth.displayName}
              type="password"
              value={fields.secret_text ?? ''}
              onChange={(value) => setField('secret_text', value)}
            />
          )}
          {auth.type === PropertyType.BASIC_AUTH && (
            <>
              <Field
                label={t('Username')}
                value={fields.username ?? ''}
                onChange={(value) => setField('username', value)}
              />
              <Field
                label={t('Password')}
                type="password"
                value={fields.password ?? ''}
                onChange={(value) => setField('password', value)}
              />
            </>
          )}
          {auth.type === PropertyType.CUSTOM_AUTH &&
            Object.entries(auth.props).map(([key, prop]) => {
              const meta = readPropMeta(prop);
              return (
                <Field
                  key={key}
                  label={meta.label ?? key}
                  type={meta.isSecret ? 'password' : 'text'}
                  value={fields[key] ?? ''}
                  onChange={(value) => setField(key, value)}
                />
              );
            })}
          {auth.type === PropertyType.OAUTH2 &&
            oauth2Type === AppConnectionType.OAUTH2 && (
              <>
                <Field
                  label={t('Client ID')}
                  value={fields.client_id ?? ''}
                  onChange={(value) => setField('client_id', value)}
                />
                <Field
                  label={t('Client Secret')}
                  type="password"
                  value={fields.client_secret ?? ''}
                  onChange={(value) => setField('client_secret', value)}
                />
              </>
            )}
        </div>
        {errorMessage && (
          <p className="text-sm text-destructive">{errorMessage}</p>
        )}
        <Button className="w-full" loading={isPending} onClick={() => mutate()}>
          {auth.type === PropertyType.OAUTH2
            ? t('Connect')
            : t('Save connection')}
        </Button>
      </div>
    </>
  );
};

function readPropMeta(prop: unknown): {
  label: string | undefined;
  isSecret: boolean;
} {
  if (typeof prop !== 'object' || prop === null) {
    return { label: undefined, isSecret: false };
  }
  const label =
    'displayName' in prop && typeof prop.displayName === 'string'
      ? prop.displayName
      : undefined;
  const isSecret = 'type' in prop && prop.type === PropertyType.SECRET_TEXT;
  return { label, isSecret };
}

const Field = ({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) => (
  <div className="flex flex-col gap-1">
    <Label>{label}</Label>
    <Input
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  </div>
);

const PieceHeader = ({
  logoUrl,
  displayName,
  title,
  subtitle,
}: {
  logoUrl: string;
  displayName: string;
  title: string;
  subtitle?: string;
}) => (
  <div className="mb-6 flex flex-col items-center text-center">
    <PieceIcon
      size="xl"
      border
      showTooltip={false}
      logoUrl={logoUrl}
      displayName={displayName}
    />
    <h1 className="mt-4 text-2xl font-bold tracking-tight">{title}</h1>
    {subtitle && (
      <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
    )}
  </div>
);

const StatusHeader = ({
  icon,
  title,
  subtitle,
  variant,
}: {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  variant: 'success' | 'destructive';
}) => (
  <div className="mb-6 flex flex-col items-center text-center">
    <div
      className={cn(
        'flex size-12 items-center justify-center rounded-md border',
        {
          'border-success-200 bg-success-100 text-success-600':
            variant === 'success',
          'border-destructive-200 bg-destructive-100 text-destructive-600':
            variant === 'destructive',
        },
      )}
    >
      {icon}
    </div>
    <h1 className="mt-4 text-2xl font-bold tracking-tight">{title}</h1>
    {subtitle && (
      <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
    )}
  </div>
);

async function buildConnection({
  auth,
  fields,
  token,
  oauth2App,
  thirdPartyRedirectUrl,
  base,
}: {
  auth: PieceAuthProperty;
  fields: Record<string, string>;
  token: string;
  oauth2App: ConnectOAuth2App | null;
  thirdPartyRedirectUrl: string | null;
  base: {
    externalId: string;
    displayName: string;
    pieceName: string;
    projectId: string;
  };
}): Promise<UpsertAppConnectionRequestBody> {
  switch (auth.type) {
    case PropertyType.SECRET_TEXT:
      return {
        ...base,
        type: AppConnectionType.SECRET_TEXT,
        value: {
          type: AppConnectionType.SECRET_TEXT,
          secret_text: fields.secret_text ?? '',
        },
      };
    case PropertyType.BASIC_AUTH:
      return {
        ...base,
        type: AppConnectionType.BASIC_AUTH,
        value: {
          type: AppConnectionType.BASIC_AUTH,
          username: fields.username ?? '',
          password: fields.password ?? '',
        },
      };
    case PropertyType.CUSTOM_AUTH:
      return {
        ...base,
        type: AppConnectionType.CUSTOM_AUTH,
        value: {
          type: AppConnectionType.CUSTOM_AUTH,
          props: { ...fields },
        },
      };
    case PropertyType.OAUTH2: {
      const scopes = auth.scope ?? [];
      const oauth2Type = oauth2App?.oauth2Type ?? AppConnectionType.OAUTH2;
      const clientId = oauth2App?.clientId ?? fields.client_id ?? '';
      const redirectUrl =
        oauth2Type === AppConnectionType.CLOUD_OAUTH2
          ? CLOUD_REDIRECT_URL
          : thirdPartyRedirectUrl ?? CLOUD_REDIRECT_URL;
      const { authorizationUrl, codeVerifier } =
        await connectApi.getOAuth2AuthorizationUrl({
          token,
          clientId,
          redirectUrl,
          scopes,
        });
      const { code } = await oauth2Utils.openOAuth2Popup({
        authorizationUrl,
        redirectUrl,
        codeVerifier,
      });
      const commonValue = {
        client_id: clientId,
        code,
        code_challenge: codeVerifier,
        scope: scopes.join(' '),
      };
      if (oauth2Type === AppConnectionType.CLOUD_OAUTH2) {
        return {
          ...base,
          type: AppConnectionType.CLOUD_OAUTH2,
          value: { type: AppConnectionType.CLOUD_OAUTH2, ...commonValue },
        };
      }
      if (oauth2Type === AppConnectionType.PLATFORM_OAUTH2) {
        return {
          ...base,
          type: AppConnectionType.PLATFORM_OAUTH2,
          value: {
            type: AppConnectionType.PLATFORM_OAUTH2,
            ...commonValue,
            redirect_url: redirectUrl,
          },
        };
      }
      return {
        ...base,
        type: AppConnectionType.OAUTH2,
        value: {
          type: AppConnectionType.OAUTH2,
          ...commonValue,
          client_secret: fields.client_secret ?? '',
          redirect_url: redirectUrl,
        },
      };
    }
    default:
      throw new Error('Unsupported authentication type');
  }
}

ConnectPage.displayName = 'ConnectPage';

export { ConnectPage };
