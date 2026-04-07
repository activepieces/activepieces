import {
  OAuth2Property,
  OAuth2Props,
  PieceMetadataModel,
  PieceMetadataModelSummary,
} from '@activepieces/pieces-framework';
import {
  ApFlagId,
  AppConnectionType,
  OAuth2GrantType,
  UpsertCloudOAuth2Request,
  UpsertOAuth2Request,
  UpsertPlatformOAuth2Request,
  isNil,
} from '@activepieces/shared';
import { t } from 'i18next';
import { Dispatch, SetStateAction, useState } from 'react';
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
import { OAuth2App, oauth2Utils } from '@/features/connections';
import { appConnectionsApi } from '@/features/connections/api/app-connections';
import { flagsHooks } from '@/hooks/flags-hooks';
import { cn } from '@/lib/utils';

import { GenericPropertiesForm } from '../builder/piece-properties/generic-properties-form';

import { SecretInput } from './secret-input';

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

  const isClientIdValid = isNil(
    form.formState.errors.request?.value?.client_id,
  );
  const isClientSecretValid =
    oauth2App.oauth2Type !== AppConnectionType.OAUTH2 ||
    form.getValues('request.value.client_secret');
  const isPropsValid = isNil(form.formState.errors.request?.value?.props);
  const isConnectButtonEnabled =
    isClientIdValid && isClientSecretValid && isPropsValid;
  const { data: thirdPartyUrl } = flagsHooks.useFlag<string>(
    ApFlagId.THIRD_PARTY_AUTH_PROVIDER_REDIRECT_URL,
  );
  const redirectUrl =
    oauth2App.oauth2Type === AppConnectionType.CLOUD_OAUTH2
      ? 'https://secrets.activepieces.com/redirect'
      : thirdPartyUrl ?? 'no_redirect_url_found';

  const showRedirectUrlInput =
    oauth2App.oauth2Type === AppConnectionType.OAUTH2 &&
    grantType === OAuth2GrantType.AUTHORIZATION_CODE;
  const [loading, setLoading] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      {showRedirectUrlInput && (
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
              <FormItem className="flex flex-col gap-2">
                <FormLabel
                  className="flex items-center gap-1"
                  showRequiredIndicator
                >
                  <span>{t('Client ID')}</span>
                </FormLabel>
                <FormControl>
                  <SecretInput {...field} type="text" />
                </FormControl>
              </FormItem>
            )}
          ></FormField>
          <FormField
            name="request.value.client_secret"
            control={form.control}
            render={({ field }) => (
              <FormItem className="flex flex-col gap-2">
                <FormLabel
                  className="flex items-center gap-1"
                  showRequiredIndicator
                >
                  <span>{t('Client Secret')}</span>
                </FormLabel>
                <FormControl>
                  <SecretInput {...field} type="password" />
                </FormControl>
              </FormItem>
            )}
          ></FormField>
        </>
      )}
      {authProperty.props && (
        <GenericPropertiesForm
          prefixValue="request.value.props"
          props={authProperty.props}
          useMentionTextInput={false}
          propertySettings={null}
          dynamicPropsInfo={null}
        />
      )}

      {grantType !== OAuth2GrantType.CLIENT_CREDENTIALS && (
        <FormField
          name="request.value.code"
          control={form.control}
          render={({ field }) => {
            const hasCode = !isNil(field.value) && field.value !== '';
            return (
              <FormItem className="flex flex-col gap-2">
                <FormControl>
                  <input type="hidden" {...field} />
                </FormControl>
                <div className="border border-solid p-2 rounded-lg gap-2 flex text-center items-center justify-center h-full">
                  <div className="rounded-full  border border-solid p-1 flex items-center justify-center">
                    <img src={piece.logoUrl} className="w-5 h-5"></img>
                  </div>
                  <div className="text-sm">{piece.displayName}</div>
                  <div className="grow"></div>
                  <Button
                    size={'sm'}
                    variant={'basic'}
                    className={cn(hasCode && 'text-destructive')}
                    disabled={!isConnectButtonEnabled}
                    loading={loading}
                    type="button"
                    onClick={async () => {
                      if (!hasCode) {
                        openPopup(
                          redirectUrl,
                          form.getValues().request.value.client_id,
                          form.getValues().request.value.props,
                          piece.name,
                          form,
                          setLoading,
                        );
                      } else {
                        field.onChange('');
                        form.setValue('request.value.code_challenge', '', {
                          shouldValidate: true,
                        });
                      }
                    }}
                  >
                    {hasCode ? t('Disconnect') : t('Connect')}
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            );
          }}
        />
      )}
    </div>
  );
}

OAuth2ConnectionSettings.displayName = 'OAuth2ConnectionSettings';
export { OAuth2ConnectionSettings };

async function openPopup(
  redirectUrl: string,
  clientId: string,
  props: Record<string, unknown> | undefined,
  pieceName: string,
  form: UseFormReturn<{
    request:
      | UpsertCloudOAuth2Request
      | UpsertOAuth2Request
      | UpsertPlatformOAuth2Request;
  }>,
  setLoading: Dispatch<SetStateAction<boolean>>,
) {
  let authorizationUrl, codeVerifier;
  try {
    setLoading(true);
    const result = await appConnectionsApi.getOAuth2AuthorizationUrl({
      pieceName,
      clientId,
      redirectUrl,
      props,
    });
    authorizationUrl = result.authorizationUrl;
    codeVerifier = result.codeVerifier;
  } catch (error: unknown) {
    form.setError('request.value.client_id', {
      type: 'manual',
      message:
        error instanceof Error
          ? error.message
          : 'Failed to initiate OAuth2 authentication',
    });
    setLoading(false);
    return;
  }
  setLoading(false);
  const { code } = await oauth2Utils.openOAuth2Popup({
    authorizationUrl,
    redirectUrl,
    codeVerifier,
  });
  form.setValue('request.value.code', code, { shouldValidate: true });
  form.setValue('request.value.code_challenge', codeVerifier ?? '', {
    shouldValidate: true,
  });
}

type OAuth2ConnectionSettingsProps = {
  piece: PieceMetadataModelSummary | PieceMetadataModel;
  authProperty: OAuth2Property<OAuth2Props>;
  oauth2App: OAuth2App;
  grantType: OAuth2GrantType;
};
