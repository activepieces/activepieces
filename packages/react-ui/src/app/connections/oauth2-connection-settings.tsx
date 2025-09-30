import { t } from 'i18next';
import { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { SkeletonList } from '@/components/ui/skeleton';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { oauth2Utils } from '@/lib/oauth2-utils';
import {
  OAuth2Property,
  OAuth2Props,
  PieceMetadataModel,
  PieceMetadataModelSummary,
  PropertyType,
} from '@activepieces/pieces-framework';
import {
  resolveValueFromProps,
  ApEdition,
  ApFlagId,
  AppConnectionType,
  AppConnectionWithoutSensitiveData,
  BOTH_CLIENT_CREDENTIALS_AND_AUTHORIZATION_CODE,
  OAuth2GrantType,
  UpsertCloudOAuth2Request,
  UpsertOAuth2Request,
  UpsertPlatformOAuth2Request,
  isNil,
} from '@activepieces/shared';

import {
  oauthAppsQueries,
  PieceToClientIdMap,
} from '../../features/connections/lib/oauth-apps-hooks';
import { formUtils } from '../../features/pieces/lib/form-utils';
import { AutoPropertiesFormComponent } from '../builder/piece-properties/auto-properties-form';

type OAuth2ConnectionSettingsProps = {
  piece: PieceMetadataModelSummary | PieceMetadataModel;
  authProperty: OAuth2Property<OAuth2Props>;
  reconnectConnection: AppConnectionWithoutSensitiveData | null;
};
const getOAuth2TypeAndApp = (
  pieceToClientIdMap: PieceToClientIdMap,
  reconnectConnection: AppConnectionWithoutSensitiveData | null,
  pieceName: string,
) => {
  const platformApp =
    pieceToClientIdMap[`${pieceName}-${AppConnectionType.PLATFORM_OAUTH2}`] ??
    null;
  const cloudApp =
    pieceToClientIdMap[`${pieceName}-${AppConnectionType.CLOUD_OAUTH2}`];
  if (
    reconnectConnection &&
    reconnectConnection.type === AppConnectionType.OAUTH2
  ) {
    return {
      type: AppConnectionType.OAUTH2 as OAuth2Type,
      app: null,
    };
  }
  if (platformApp) {
    return {
      type: AppConnectionType.PLATFORM_OAUTH2 as OAuth2Type,
      app: platformApp,
    };
  }
  if (cloudApp) {
    return {
      type: AppConnectionType.CLOUD_OAUTH2 as OAuth2Type,
      app: cloudApp,
    };
  }
  return {
    type: AppConnectionType.OAUTH2 as OAuth2Type,
    app: null,
  };
};

const OAuth2ConnectionSettings = (props: OAuth2ConnectionSettingsProps) => {
  const { platform } = platformHooks.useCurrentPlatform();
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const { data: pieceToClientIdMap, isPending: loadingPieceToClientIdMap } =
    oauthAppsQueries.usePieceToClientIdMap(platform.cloudAuthEnabled, edition!);

  if (loadingPieceToClientIdMap || isNil(pieceToClientIdMap)) {
    return <SkeletonList numberOfItems={2} className="h-7"></SkeletonList>;
  }

  return (
    <OAuth2ConnectionSettingsImplementation
      pieceToClientIdMap={pieceToClientIdMap}
      {...props}
    />
  );
};

type OAuth2Type =
  | AppConnectionType.CLOUD_OAUTH2
  | AppConnectionType.OAUTH2
  | AppConnectionType.PLATFORM_OAUTH2;

const OAuth2ConnectionSettingsImplementation = ({
  authProperty,
  piece,
  reconnectConnection,
  pieceToClientIdMap,
}: OAuth2ConnectionSettingsProps & {
  pieceToClientIdMap: PieceToClientIdMap;
}) => {
  const [currentOAuth2Type, setOAuth2Type] = useState<OAuth2Type>(
    getOAuth2TypeAndApp(pieceToClientIdMap, reconnectConnection, piece.name)
      .type,
  );
  const [grantType, setGrantType] = useState<OAuth2GrantType>(
    authProperty.grantType === BOTH_CLIENT_CREDENTIALS_AND_AUTHORIZATION_CODE
      ? OAuth2GrantType.AUTHORIZATION_CODE
      : authProperty.grantType ?? OAuth2GrantType.AUTHORIZATION_CODE,
  );

  return (
    <OAuth2ConnectionSettingsForm
      key={`${currentOAuth2Type}-${grantType}`}
      predefinedApp={
        getOAuth2TypeAndApp(pieceToClientIdMap, reconnectConnection, piece.name)
          .app
      }
      authProperty={authProperty}
      currentOAuth2Type={currentOAuth2Type}
      currentGrantType={grantType}
      isNewConnection={isNil(reconnectConnection)}
      piece={piece}
      setOAuth2Type={setOAuth2Type}
      setGrantType={setGrantType}
      resetOAuth2Type={() =>
        setOAuth2Type(
          getOAuth2TypeAndApp(
            pieceToClientIdMap,
            reconnectConnection,
            piece.name,
          ).type,
        )
      }
    />
  );
};

const doesPieceAllowSwitchingGrantType = (
  piece: PieceMetadataModelSummary | PieceMetadataModel,
) => {
  return (
    piece.auth?.type === PropertyType.OAUTH2 &&
    piece.auth.grantType === BOTH_CLIENT_CREDENTIALS_AND_AUTHORIZATION_CODE
  );
};

type OAuth2ConnectionSettingsFormParams = {
  predefinedApp: {
    clientId: string;
    type: OAuth2Type;
  } | null;
  authProperty: OAuth2Property<OAuth2Props>;
  currentOAuth2Type: OAuth2Type;
  currentGrantType: OAuth2GrantType;
  isNewConnection: boolean;
  piece: PieceMetadataModelSummary | PieceMetadataModel;
  setOAuth2Type: (oauth2Type: OAuth2Type) => void;
  setGrantType: (grantType: OAuth2GrantType) => void;
  resetOAuth2Type: () => void;
};

const OAuth2ConnectionSettingsForm = ({
  predefinedApp,
  authProperty,
  currentOAuth2Type,
  currentGrantType,
  isNewConnection,
  piece,
  setOAuth2Type,
  setGrantType,
  resetOAuth2Type,
}: OAuth2ConnectionSettingsFormParams) => {
  const { data: thirdPartyUrl } = flagsHooks.useFlag<string>(
    ApFlagId.THIRD_PARTY_AUTH_PROVIDER_REDIRECT_URL,
  );
  const [readyToConnect, setReadyToConnect] = useState(false);
  const redirectUrl =
    currentOAuth2Type === AppConnectionType.CLOUD_OAUTH2
      ? 'https://secrets.activepieces.com/redirect'
      : thirdPartyUrl;

  const form = useFormContext<{
    request:
      | UpsertCloudOAuth2Request
      | UpsertOAuth2Request
      | UpsertPlatformOAuth2Request;
  }>();

  const hasCode = form.getValues().request.value.code;
  useEffect(() => {
    form.setValue(
      'request.value.redirect_url',
      redirectUrl ?? 'no_redirect_url_found',
      {
        shouldValidate: true,
      },
    );
    const defaultValuesForProps = Object.fromEntries(
      Object.entries(
        formUtils.getDefaultValueForStep({
          props: authProperty.props ?? {},
          existingInput: {},
        }),
      ).map(([key, value]) => [key, value === undefined ? '' : value]),
    );
    form.setValue('request.value.props', defaultValuesForProps, {
      shouldValidate: true,
    });
    form.setValue(
      'request.value.client_secret',
      currentOAuth2Type === AppConnectionType.OAUTH2 ? '' : 'FAKE_SECRET',
      { shouldValidate: true },
    );
    form.setValue(
      'request.value.client_id',
      currentOAuth2Type === AppConnectionType.OAUTH2
        ? ''
        : predefinedApp?.clientId ?? '',
      { shouldValidate: true },
    );
    form.setValue('request.value.grant_type', currentGrantType, {
      shouldValidate: true,
    });
    form.setValue(
      'request.value.code',
      currentGrantType === OAuth2GrantType.CLIENT_CREDENTIALS
        ? 'FAKE_CODE'
        : '',
      { shouldValidate: true },
    );
    form.setValue('request.value.code_challenge', '', { shouldValidate: true });
    form.setValue('request.value.type', currentOAuth2Type, {
      shouldValidate: true,
    });
    form.setValue('request.type', currentOAuth2Type, { shouldValidate: true });
  }, []);

  form.watch((values) => {
    const baseCriteria =
      !isNil(redirectUrl) && !isNil(values.request?.value?.client_id);
    const clientSecret = (values.request as UpsertOAuth2Request)?.value
      ?.client_secret;
    const hasClientSecret = !isNil(clientSecret);
    const propsValues = values.request?.value?.props ?? {};
    const arePropsValid = authProperty.props
      ? Object.keys(authProperty.props).reduce((acc, key) => {
          return (
            acc &&
            ((!isNil(propsValues[key]) && propsValues[key] !== '') ||
              !authProperty.props?.[key]?.required)
          );
        }, true)
      : true;
    setReadyToConnect(
      baseCriteria &&
        (currentOAuth2Type !== AppConnectionType.OAUTH2 || hasClientSecret) &&
        arePropsValid,
    );
  });
  const [refresh, setRefresh] = useState(0);
  const openPopup = async (
    redirectUrl: string,
    clientId: string,
    props: Record<string, string> | undefined,
  ) => {
    const scope = resolveValueFromProps(props, authProperty.scope.join(' '));
    const authUrl = resolveValueFromProps(props, authProperty.authUrl);
    const { code, codeChallenge } = await oauth2Utils.openOAuth2Popup({
      authUrl,
      clientId,
      redirectUrl,
      scope,
      prompt: authProperty.prompt,
      pkce: authProperty.pkce ?? false,
      pkceMethod: authProperty.pkceMethod ?? 'plain',
      extraParams: authProperty.extra ?? {},
    });
    form.setValue('request.value.code', code, { shouldValidate: true });
    form.setValue('request.value.code_challenge', codeChallenge, {
      shouldValidate: true,
    });
    setRefresh(refresh + 1);
  };

  return (
    <div className="flex flex-col gap-4">
      {currentOAuth2Type === AppConnectionType.OAUTH2 &&
        authProperty.grantType !== OAuth2GrantType.CLIENT_CREDENTIALS && (
          <div className="flex flex-col gap-2">
            <FormLabel>{t('Redirect URL')}</FormLabel>
            <FormControl>
              <Input disabled type="text" value={redirectUrl ?? ''} />
            </FormControl>
            <FormMessage />
          </div>
        )}

      {currentOAuth2Type === AppConnectionType.OAUTH2 && (
        <>
          <FormField
            name="request.value.client_id"
            control={form.control}
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>{t('Client ID')}</FormLabel>
                <FormControl>
                  <Input {...field} type="text" placeholder={t('Client ID')} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          ></FormField>
          <FormField
            name="request.value.client_secret"
            control={form.control}
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>{t('Client Secret')}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="password"
                    placeholder={t('Client Secret')}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          ></FormField>
        </>
      )}
      {authProperty.props && (
        <AutoPropertiesFormComponent
          prefixValue="request.value.props"
          props={authProperty.props}
          useMentionTextInput={false}
          allowDynamicValues={false}
        />
      )}

      {currentGrantType !== OAuth2GrantType.CLIENT_CREDENTIALS && (
        <div className="border border-solid p-2 rounded-lg gap-2 flex text-center items-center justify-center h-full">
          <div className="rounded-full border border-solid p-1 flex items-center justify-center">
            <img src={piece.logoUrl} className="w-5 h-5"></img>
          </div>
          <div className="text-sm">{piece.displayName}</div>
          <div className="flex-grow"></div>
          {!hasCode && (
            <Button
              size={'sm'}
              variant={'basic'}
              disabled={!readyToConnect}
              type="button"
              onClick={async () =>
                openPopup(
                  redirectUrl!,
                  form.getValues().request.value.client_id,
                  form.getValues().request.value.props,
                )
              }
            >
              {t('Connect')}
            </Button>
          )}
          {hasCode && (
            <Button
              size={'sm'}
              variant={'basic'}
              className="text-destructive"
              onClick={() => {
                form.setValue('request.value.code', '', {
                  shouldValidate: true,
                });
                form.setValue('request.value.code_challenge', '', {
                  shouldValidate: true,
                });
              }}
            >
              {t('Disconnect')}
            </Button>
          )}
        </div>
      )}

      {isNewConnection &&
        currentOAuth2Type !== AppConnectionType.OAUTH2 &&
        currentGrantType !== OAuth2GrantType.CLIENT_CREDENTIALS && (
          <div>
            <Button
              size="sm"
              variant={'link'}
              className="text-xs"
              type="button"
              onClick={() => setOAuth2Type(AppConnectionType.OAUTH2)}
            >
              {t('I would like to use my own App Credentials')}
            </Button>
          </div>
        )}
      {currentOAuth2Type === AppConnectionType.OAUTH2 &&
        isNewConnection &&
        predefinedApp &&
        currentGrantType !== OAuth2GrantType.CLIENT_CREDENTIALS && (
          <div>
            <Button
              size="sm"
              variant={'link'}
              className="text-xs"
              type="button"
              onClick={() => setOAuth2Type(predefinedApp.type)}
            >
              {t('I would like to use predefined App Credentials')}
            </Button>
          </div>
        )}
      {doesPieceAllowSwitchingGrantType(piece) && (
        <>
          {currentGrantType == OAuth2GrantType.AUTHORIZATION_CODE && (
            <div>
              <Button
                size="sm"
                variant={'link'}
                className="text-xs"
                type="button"
                onClick={() => {
                  setGrantType(OAuth2GrantType.CLIENT_CREDENTIALS);
                  setOAuth2Type(AppConnectionType.OAUTH2);
                }}
              >
                {t('I would like to use Client Credentials')}
              </Button>
            </div>
          )}
          {currentGrantType === OAuth2GrantType.CLIENT_CREDENTIALS && (
            <div>
              <Button
                size="sm"
                variant={'link'}
                type="button"
                className="text-xs"
                onClick={() => {
                  setGrantType(OAuth2GrantType.AUTHORIZATION_CODE);
                  resetOAuth2Type();
                }}
              >
                {t('I would like to use Authorization Code')}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

OAuth2ConnectionSettings.displayName = 'OAuth2ConnectionSettings';
export { OAuth2ConnectionSettings };
