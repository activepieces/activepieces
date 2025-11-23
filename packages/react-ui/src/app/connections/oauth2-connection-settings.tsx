import { t } from 'i18next';
import { useEffect, useState } from 'react';
import { useFormContext, UseFormReturn } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { flagsHooks } from '@/hooks/flags-hooks';
import { OAuth2App, oauth2Utils } from '@/lib/oauth2-utils';
import {
  OAuth2Property,
  OAuth2Props,
  PieceMetadataModel,
  PieceMetadataModelSummary,
} from '@activepieces/pieces-framework';
import {
  resolveValueFromProps,
  ApFlagId,
  AppConnectionType,
  OAuth2GrantType,
  UpsertCloudOAuth2Request,
  UpsertOAuth2Request,
  UpsertPlatformOAuth2Request,
  isNil,
} from '@activepieces/shared';

import { formUtils } from '../../features/pieces/lib/form-utils';
import { AutoPropertiesFormComponent } from '../builder/piece-properties/auto-properties-form';


function OAuth2ConnectionSettings({
  authProperty,
  oauth2App,
  piece,
  grantType,
}: OAuth2ConnectionSettingsProps) {

  const form = useFormContext<{
    request:
      | UpsertCloudOAuth2Request
      | UpsertOAuth2Request
      | UpsertPlatformOAuth2Request;
  }>();
  const isConnectButtonEnabled = useIsConnectButtonEnabled(authProperty, form);
  const { data: thirdPartyUrl } = flagsHooks.useFlag<string>(
    ApFlagId.THIRD_PARTY_AUTH_PROVIDER_REDIRECT_URL,
  );
  const redirectUrl =
    oauth2App.oauth2Type === AppConnectionType.CLOUD_OAUTH2
      ? 'https://secrets.activepieces.com/redirect'
      : thirdPartyUrl ?? 'no_redirect_url_found';

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
  };
  useSetDefaultValues({
    redirectUrl,
    authProperty,
    oauth2App,
    grantType,
    form,
  });
  const hasCode = form.getValues().request.value.code;

  return (
    <div className="flex flex-col gap-4">
      {oauth2App.oauth2Type === AppConnectionType.OAUTH2 &&
        grantType === OAuth2GrantType.AUTHORIZATION_CODE && (
          <div className="flex flex-col gap-2">
            <FormLabel>{t('Redirect URL')}</FormLabel>
            <FormControl>
              <Input disabled type="text" value={redirectUrl} />
            </FormControl>
            <FormMessage />
          </div>
        )}

      {oauth2App.oauth2Type === AppConnectionType.OAUTH2 && (
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

      {grantType !== OAuth2GrantType.CLIENT_CREDENTIALS && (
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
              disabled={!isConnectButtonEnabled}
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
    </div>
  );
};

OAuth2ConnectionSettings.displayName = 'OAuth2ConnectionSettings';
export { OAuth2ConnectionSettings };


function useSetDefaultValues({
  redirectUrl,
  authProperty,
  oauth2App,
  grantType,
  form
}: UseSetDefaultValuesProps) {
  useEffect(() => {
    form.setValue('request.value.redirect_url', redirectUrl, {
      shouldValidate: true,
    });
    const defaultValuesForProps = Object.fromEntries(
      Object.entries(
        formUtils.getDefaultValueForProperties({
          props: authProperty.props ?? {},
          existingInput: {},
        }),
      ).map(([key, value]) => [key, value === undefined ? '' : value]),
    );
    form.setValue('request.value.props', defaultValuesForProps, {
      shouldValidate: true,
    });
    form.setValue(
      'request.value.client_id',
      oauth2App.oauth2Type === AppConnectionType.OAUTH2
        ? ''
        : oauth2App.clientId,
      { shouldValidate: true },
    );
    form.setValue('request.value.grant_type', grantType, {
      shouldValidate: true,
    });
    form.setValue('request.value.code_challenge', '', { shouldValidate: true });
    form.setValue('request.value.type', oauth2App.oauth2Type, {
      shouldValidate: true,
    });
    form.setValue('request.type', oauth2App.oauth2Type, {
      shouldValidate: true,
    });
  }, []);
}

function useIsConnectButtonEnabled(authProperty: OAuth2Property<OAuth2Props>, form: UseFormReturn<{
  request: UpsertCloudOAuth2Request | UpsertOAuth2Request | UpsertPlatformOAuth2Request;
}>){
  const values = form.getValues();
  const hasClientId =
  !isNil(values.request?.value?.client_id) &&
  values.request?.value?.client_id.length > 0;
const hasClientSecret =
  values.request?.type === AppConnectionType.OAUTH2 &&
  !isNil(values.request?.value?.client_secret) &&
  values.request?.value?.client_secret.length > 0;
const propsValues = values.request?.value?.props ?? {};
const arePropsValid = authProperty.props
  ? Object.keys(authProperty.props).reduce((acc, key) => {
      return (
        acc &&
        ((!isNil(propsValues[key]) && propsValues[key].length > 0) ||
          !authProperty.props?.[key]?.required)
      );
    }, true)
  : true;
  const isClientSecretRequired = values.request?.type === AppConnectionType.OAUTH2;
  return hasClientId && (!isClientSecretRequired || hasClientSecret) && arePropsValid;
}

type UseSetDefaultValuesProps = {
  redirectUrl: string;
  authProperty: OAuth2Property<OAuth2Props>;
  oauth2App: OAuth2App;
  grantType: OAuth2GrantType;
  form: UseFormReturn<{
    request: UpsertCloudOAuth2Request | UpsertOAuth2Request | UpsertPlatformOAuth2Request;
  }>;
};

type OAuth2ConnectionSettingsProps = {
  piece: PieceMetadataModelSummary | PieceMetadataModel;
  authProperty: OAuth2Property<OAuth2Props>;
  oauth2App: OAuth2App;
  grantType: OAuth2GrantType;
};