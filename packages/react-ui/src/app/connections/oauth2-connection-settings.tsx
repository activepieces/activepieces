import { t } from 'i18next';
import { useEffect, useState, useRef } from 'react';
import { useFormContext } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { oauth2Utils } from '@/lib/oauth2-utils';
import {
  OAuth2Property,
  OAuth2Props,
  PieceMetadataModel,
  PieceMetadataModelSummary,
} from '@activepieces/pieces-framework';
import {
  ApEdition,
  ApFlagId,
  AppConnectionType,
  AppConnectionWithoutSensitiveData,
  OAuth2GrantType,
  UpsertCloudOAuth2Request,
  UpsertOAuth2Request,
  UpsertPlatformOAuth2Request,
  isNil,
} from '@activepieces/shared';

import { oauth2AppsHooks } from '../../features/connections/lib/oauth2-apps-hooks';
import { AutoPropertiesFormComponent } from '../builder/piece-properties/auto-properties-form';
import { formUtils } from '../builder/piece-properties/form-utils';
import { oauthAppsApi } from '@/features/connections/lib/oauth2-apps-api';

type OAuth2ConnectionSettingsProps = {
  piece: PieceMetadataModelSummary | PieceMetadataModel;
  authProperty: OAuth2Property<OAuth2Props>;
  reconnectConnection: AppConnectionWithoutSensitiveData | null;
};
function replaceVariables(
  authUrl: string,
  scope: string,
  props: Record<string, unknown>,
) {
  let newAuthUrl = authUrl;
  Object.entries(props).forEach(([key, value]) => {
    newAuthUrl = newAuthUrl.replace(`{${key}}`, value as string);
  });

  let newScope = scope;
  Object.entries(props).forEach(([key, value]) => {
    newScope = newScope.replace(`{${key}}`, value as string);
  });
  return {
    authUrl: newAuthUrl,
    scope: newScope,
  };
}

const OAuth2ConnectionSettings = ({
  authProperty,
  piece,
  reconnectConnection,
}: OAuth2ConnectionSettingsProps) => {
  // console.log('reconnectConnection?.type', reconnectConnection?.type);
  const { platform } = platformHooks.useCurrentPlatform();
  const [readyToConnect, setReadyToConnect] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [foundLocal, setFoundLocal]: any = useState(false);
  const [showOAuth2ForLocal, setShowOAuth2ForLocal]: any = useState(true);
  const [currentOAuth2Type, setOAuth2Type] = useState<
    | AppConnectionType.CLOUD_OAUTH2
    | AppConnectionType.OAUTH2
    | AppConnectionType.PLATFORM_OAUTH2
    | undefined
  >(
    reconnectConnection?.type === AppConnectionType.CLOUD_OAUTH2 ||
      reconnectConnection?.type === AppConnectionType.OAUTH2 ||
      reconnectConnection?.type === AppConnectionType.PLATFORM_OAUTH2
      ? reconnectConnection?.type == AppConnectionType.OAUTH2 && foundLocal
        ? AppConnectionType.CLOUD_OAUTH2
        : reconnectConnection?.type
      : undefined,
  );
  const { data: thirdPartyUrl } = flagsHooks.useFlag<string>(
    ApFlagId.THIRD_PARTY_AUTH_PROVIDER_REDIRECT_URL,
  );
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const { data: pieceToClientIdMap } = oauth2AppsHooks.usePieceToClientIdMap(
    platform.cloudAuthEnabled,
    edition!,
  );
  const { data: ownAuthEnabled } = flagsHooks.useFlag<ApEdition>(
    ApFlagId.OWN_AUTH2_ENABLED,
  );

  let pieceToClientIdApps: any = null;
  // const [pieceToClientIdApps, setPieceToClientIdApps]: any = useState(null);
  const [clientID, setClientID]: any = useState('');
  const [clientSecret, setClientSecret]: any = useState('');
  const clientIDRef = useRef(null);
  const clientSecretRef = useRef(null);
  // const [redirectUrl, setRedirectUrlState]: any = useState('');

  const redirectUrl =
    currentOAuth2Type === AppConnectionType.CLOUD_OAUTH2 && !foundLocal
      ? 'https://secrets.activepieces.com/redirect'
      : thirdPartyUrl;

  const form = useFormContext<{
    request:
      | UpsertCloudOAuth2Request
      | UpsertOAuth2Request
      | UpsertPlatformOAuth2Request;
  }>();

  const hasCode = form.getValues().request.value.code;
  const predefinedClientId = pieceToClientIdMap?.[piece.name]?.clientId;

  const mainFn1 = async () => {
    console.log('piece.name', piece.name);
    // if (isNil(pieceToClientIdMap)) return;
    // let found = false;
    let { found } = await checkFoundLocalToClientIdUse();
    console.log('found mainFn1', found);

    if (isNil(currentOAuth2Type) && !isNil(pieceToClientIdMap)) {
      setOAuth2Type(
        pieceToClientIdMap?.[piece.name]?.type ?? AppConnectionType.OAUTH2,
      );
      return;
    }
    if (found) {
      setOAuth2Type(AppConnectionType.OAUTH2);
    }

    console.log("redirectUrl",redirectUrl)
    console.log("thirdPartyUrl",thirdPartyUrl)
    if (redirectUrl) {
      
      form.setValue('request.value.redirect_url', redirectUrl, {
        shouldValidate: true,
      });
    }

    form.setValue(
      'request.value.props',
      formUtils.getDefaultValueForStep(authProperty.props ?? {}, {}),
      { shouldValidate: true },
    );
    if (!found)
      form.setValue(
        'request.value.client_secret',
        currentOAuth2Type === AppConnectionType.OAUTH2 ? '' : 'FAKE_SECRET',
        { shouldValidate: true },
      );

    if (!found)
      form.setValue(
        'request.value.client_id',
        currentOAuth2Type === AppConnectionType.OAUTH2
          ? ''
          : predefinedClientId ?? '',
        { shouldValidate: true },
      );
    form.setValue('request.value.grant_type', authProperty.grantType, {
      shouldValidate: true,
    });
    form.setValue(
      'request.value.code',
      `${
        authProperty.grantType === OAuth2GrantType.CLIENT_CREDENTIALS
          ? 'FAKE_CODE'
          : ''
      }`,
      { shouldValidate: true },
    );
    form.setValue('request.value.code_challenge', '', { shouldValidate: true });
    form.setValue('request.value.type', currentOAuth2Type!, {
      shouldValidate: true,
    });
    form.setValue('request.type', currentOAuth2Type!, { shouldValidate: true });
  };

  useEffect(() => {
    mainFn1();
  }, [currentOAuth2Type, pieceToClientIdMap]);

  const watchedForm = form.watch();

  useEffect(() => {
    const baseCriteria =
      !isNil(redirectUrl) && !isNil(form.getValues().request.value.client_id);
    const clientSecret = (form.getValues().request as UpsertOAuth2Request)
      ?.value?.client_secret;
    const hasClientSecret = !isNil(clientSecret);
    setReadyToConnect(
      baseCriteria &&
        (currentOAuth2Type !== AppConnectionType.OAUTH2 || hasClientSecret),
    );
  }, [watchedForm]);

  async function openPopup(
    redirectUrl: string,
    clientId: string,
    props: Record<string, unknown> | undefined,
  ) {
    const { authUrl, scope } = replaceVariables(
      authProperty.authUrl,
      authProperty.scope.join(' '),
      props ?? {},
    );
    console.log('authProperty.extra', authProperty.extra);
    const { code, codeChallenge } = await oauth2Utils.openOAuth2Popup({
      authUrl,
      clientId,
      redirectUrl,
      scope,
      pkce: authProperty.pkce ?? false,
      extraParams: authProperty.extra ?? {},
    });
    form.setValue('request.value.code', code, { shouldValidate: true });
    form.setValue('request.value.code_challenge', codeChallenge, {
      shouldValidate: true,
    });
    setRefresh(refresh + 1);
  }

  const checkFoundLocalToClientIdUse = async () => {
    let pieceToClientIdAppsTemp: any = pieceToClientIdApps;
    if (pieceToClientIdAppsTemp == null) {
      pieceToClientIdAppsTemp = await oauthAppsApi.listWfApps('');
    }

    let found = false;
    let objFound: any = null;
    let key: any = piece.name;
    let obj = pieceToClientIdAppsTemp[key];
    if (obj) {
      found = true;
      objFound = obj;
    }
    return { found, objFound };
  };
  const mainFn2 = async () => {
    let { found, objFound } = await checkFoundLocalToClientIdUse();
    console.log('found mainFn2', found);
    console.log('found objFound', objFound);
    setShowOAuth2ForLocal(true);
    if (found) {
      setOAuth2Type(AppConnectionType.OAUTH2);

      setClientID(objFound.clientId);
      setClientSecret(objFound.clientSecret);
      setFoundLocal(true);
      setShowOAuth2ForLocal(false);
      form.setValue('request.value.client_id', objFound.clientId, {
        shouldValidate: true,
      });
      form.setValue('request.value.client_secret', objFound.clientSecret, {
        shouldValidate: true,
      });
    }
  };
  useEffect(() => {
    if (pieceToClientIdMap == null) return;
    mainFn2();
  }, [pieceToClientIdMap]);

  return (
    <Form {...form}>
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => e.preventDefault()}
      >
        {currentOAuth2Type === AppConnectionType.OAUTH2 &&
          showOAuth2ForLocal &&
          authProperty.grantType !== OAuth2GrantType.CLIENT_CREDENTIALS && (
            <div className="flex flex-col gap-2">
              <FormLabel>{t('Redirect URL')}</FormLabel>
              <FormControl>
                <Input disabled type="text" value={redirectUrl ?? ''} />
              </FormControl>
              <FormMessage />
            </div>
          )}

        {currentOAuth2Type === AppConnectionType.OAUTH2 &&
          showOAuth2ForLocal && (
            <>
              <FormField
                name="request.value.client_id"
                control={form.control}
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{t('Client ID')}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="text"
                        placeholder={t('Client ID')}
                        // disabled={foundLocal}
                      />
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
                        // disabled={foundLocal}
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

        {authProperty.grantType !== OAuth2GrantType.CLIENT_CREDENTIALS && (
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
                onClick={async () => {
                  let client_id = form.getValues().request.value.client_id;
                  if (foundLocal) {
                    form.setValue(
                      'request.value.type',
                      AppConnectionType.OAUTH2,
                      {
                        shouldValidate: true,
                      },
                    );
                    //@ts-ignore
                    form.setValue('request.value.redirect_url', redirectUrl, {
                      shouldValidate: true,
                    });
                  }
                  if (foundLocal && !showOAuth2ForLocal) {
                    client_id = clientID;
                  }
                  console.log('foundLocal', foundLocal);
                  console.log('redirectUrl', redirectUrl);
                  console.log(
                    'form.getValues().request.value.props',
                    form.getValues().request.value.props,
                  );
                  // console.log(
                  //   'form.getValues().request.value.client_id',
                  //   form.getValues().request.value.client_id,
                  // );
                  console.log('client_id', client_id);

                  console.log(
                    'form.getValues().request.value.client_secret',
                    //@ts-ignore
                    form.getValues().request.value.client_secret,
                  );

                  console.log('currentOAuth2Type', currentOAuth2Type);

                  openPopup(
                    redirectUrl!,
                    client_id,
                    form.getValues().request.value.props,
                  );
                }}
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

        {foundLocal ? (
          <>
            <div>
              <div
                style={{
                  fontSize: '.75rem',
                  lineHeight: '1rem',
                  cursor: 'pointer',
                  color: '#6e41e2',
                  height: '2.25rem',
                  alignContent: 'center',
                }}
                onClick={() => {
                  if (showOAuth2ForLocal) {
                    setShowOAuth2ForLocal(false);
                    form.setValue('request.value.client_id', clientID, {
                      shouldValidate: true,
                    });
                    form.setValue('request.value.client_secret', clientSecret, {
                      shouldValidate: true,
                    });
                  } else {
                    setShowOAuth2ForLocal(true);
                    form.setValue('request.value.client_id', '', {
                      shouldValidate: true,
                    });
                    form.setValue('request.value.client_secret', '', {
                      shouldValidate: true,
                    });
                  }
                }}
              >
                {showOAuth2ForLocal ? (
                  <>{t('I would like to use predefined App Credentials')}</>
                ) : (
                  <>{t('I would like to use my own App Credentials')}</>
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            {ownAuthEnabled &&
              isNil(reconnectConnection) &&
              currentOAuth2Type !== AppConnectionType.OAUTH2 && (
                <div>
                  <Button
                    size="sm"
                    variant={'link'}
                    className="text-xs"
                    onClick={() => {
                      setOAuth2Type(AppConnectionType.OAUTH2);
                      // if (foundLocalBackup) {
                      //   setFoundLocal(false);
                      // }
                    }}
                  >
                    {t('I would like to use my own App Credentials')}
                  </Button>
                </div>
              )}
            {currentOAuth2Type === AppConnectionType.OAUTH2 &&
              !foundLocal &&
              isNil(reconnectConnection) &&
              predefinedClientId && (
                <div>
                  <Button
                    size="sm"
                    variant={'link'}
                    className="text-xs"
                    onClick={() => {
                      setOAuth2Type(AppConnectionType.CLOUD_OAUTH2);
                      // if (foundLocalBackup) {
                      //   setFoundLocal(false);
                      // }
                    }}
                  >
                    {t('I would like to use predefined App Credentials')}
                  </Button>
                </div>
              )}
          </>
        )}
      </form>
    </Form>
  );
};

OAuth2ConnectionSettings.displayName = 'OAuth2ConnectionSettings';
export { OAuth2ConnectionSettings };
