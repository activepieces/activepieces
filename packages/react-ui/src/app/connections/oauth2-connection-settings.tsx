import { t } from 'i18next';
import { useEffect, useState } from 'react';
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
  const { platform } = platformHooks.useCurrentPlatform();
  const [readyToConnect, setReadyToConnect] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [currentOAuth2Type, setOAuth2Type] = useState<
    | AppConnectionType.CLOUD_OAUTH2
    | AppConnectionType.OAUTH2
    | AppConnectionType.PLATFORM_OAUTH2
    | undefined
  >(
    reconnectConnection?.type === AppConnectionType.CLOUD_OAUTH2 ||
      reconnectConnection?.type === AppConnectionType.OAUTH2 ||
      reconnectConnection?.type === AppConnectionType.PLATFORM_OAUTH2
      ? reconnectConnection?.type
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
  const predefinedClientId = pieceToClientIdMap?.[piece.name]?.clientId;
  useEffect(() => {
    if (isNil(currentOAuth2Type) && !isNil(pieceToClientIdMap)) {
      setOAuth2Type(
        pieceToClientIdMap?.[piece.name]?.type ?? AppConnectionType.OAUTH2,
      );
      return;
    }
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
    form.setValue(
      'request.value.client_secret',
      currentOAuth2Type === AppConnectionType.OAUTH2 ? '' : 'FAKE_SECRET',
      { shouldValidate: true },
    );

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
  }, [currentOAuth2Type, pieceToClientIdMap]);

  const watchedForm = form.watch();

  useEffect(() => {
    const baseCriteria =
      !isNil(redirectUrl) && !isNil(form.getValues().request.value.client_id);
    const clientSecret = (form.getValues().request as UpsertOAuth2Request)
      ?.value?.client_secret;
    const hasClientSecret = !isNil(clientSecret);
    const propsValues = form.getValues('request.value.props') ?? {};
    const arePropsValid = authProperty.props
      ? Object.keys(authProperty.props).reduce((acc, key) => {
          return acc && !isNil(propsValues[key]) && propsValues[key] !== '';
        }, true)
      : true;

    setReadyToConnect(
      baseCriteria &&
        (currentOAuth2Type !== AppConnectionType.OAUTH2 || hasClientSecret) &&
        arePropsValid,
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

  return (
    <Form {...form}>
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => e.preventDefault()}
      >
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
                    <Input
                      {...field}
                      type="text"
                      placeholder={t('Client ID')}
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

        {ownAuthEnabled &&
          isNil(reconnectConnection) &&
          currentOAuth2Type !== AppConnectionType.OAUTH2 && (
            <div>
              <Button
                size="sm"
                variant={'link'}
                className="text-xs"
                onClick={() => setOAuth2Type(AppConnectionType.OAUTH2)}
              >
                {t('I would like to use my own App Credentials')}
              </Button>
            </div>
          )}
        {currentOAuth2Type === AppConnectionType.OAUTH2 &&
          isNil(reconnectConnection) &&
          predefinedClientId && (
            <div>
              <Button
                size="sm"
                variant={'link'}
                className="text-xs"
                onClick={() => setOAuth2Type(AppConnectionType.CLOUD_OAUTH2)}
              >
                {t('I would like to use predefined App Credentials')}
              </Button>
            </div>
          )}
      </form>
    </Form>
  );
};

OAuth2ConnectionSettings.displayName = 'OAuth2ConnectionSettings';
export { OAuth2ConnectionSettings };
