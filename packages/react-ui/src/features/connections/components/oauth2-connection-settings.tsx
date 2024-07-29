import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form';
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
  UpsertCloudOAuth2Request,
  UpsertOAuth2Request,
  UpsertPlatformOAuth2Request,
  isNil,
} from '@activepieces/shared';

import { oauth2AppsHooks } from '../lib/oauth2-apps-hooks';

type OAuth2ConnectionSettingsProps = {
  piece: PieceMetadataModelSummary | PieceMetadataModel;
  authProperty: OAuth2Property<OAuth2Props>;
};

const OAuth2ConnectionSettings = ({
  authProperty,
  piece,
}: OAuth2ConnectionSettingsProps) => {
  const queryClient = useQueryClient();
  const { data: platform } = platformHooks.useCurrentPlatform();
  const [readyToConect, setReadyToConect] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [currentOAuth2Type, setOAuth2Type] = useState<
    | AppConnectionType.CLOUD_OAUTH2
    | AppConnectionType.OAUTH2
    | AppConnectionType.PLATFORM_OAUTH2
    | undefined
  >(undefined);
  const { data: thirdPartyUrl } = flagsHooks.useFlag<string>(
    ApFlagId.THIRD_PARTY_AUTH_PROVIDER_REDIRECT_URL,
    queryClient,
  );
  const { data: pieceToClientIdMap } = oauth2AppsHooks.usePieceToClientIdMap(
    platform.cloudAuthEnabled,
  );
  const { data: ownAuthEnabled } = flagsHooks.useFlag<ApEdition>(
    ApFlagId.OWN_AUTH2_ENABLED,
    queryClient,
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
      'request.value.client_secret',
      currentOAuth2Type === AppConnectionType.OAUTH2 ? '' : 'FAKE_SECRET',
      { shouldValidate: true },
    );
    form.setValue(
      'request.value.client_id',
      currentOAuth2Type === AppConnectionType.OAUTH2
        ? ''
        : pieceToClientIdMap?.[piece.name].clientId ?? '',
      { shouldValidate: true },
    );
    form.setValue('request.value.code', '', { shouldValidate: true });
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
    setReadyToConect(
      baseCriteria &&
        (currentOAuth2Type !== AppConnectionType.OAUTH2 || hasClientSecret),
    );
  }, [watchedForm]);

  async function openPopup(redirectUrl: string, clientId: string) {
    const { code, codeChallenge } = await oauth2Utils.openOAuth2Popup({
      authUrl: authProperty.authUrl,
      clientId,
      redirectUrl,
      scope: authProperty.scope.join(' '),
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
        {currentOAuth2Type === AppConnectionType.OAUTH2 && (
          <>
            <FormField
              name="request.value.client_id"
              control={form.control}
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <div className="text-md font-medium">Client ID</div>
                  <Input {...field} type="text" placeholder="Client ID" />
                  <FormMessage />
                </FormItem>
              )}
            ></FormField>
            <FormField
              name="request.value.client_secret"
              control={form.control}
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <div className="text-md font-medium">Client Secret</div>
                  <Input {...field} type="text" placeholder="Client Secret" />
                  <FormMessage />
                </FormItem>
              )}
            ></FormField>
          </>
        )}

        <div className="border border-solid p-2 rounded-lg gap-2 flex text-center items-center justify-center h-ful">
          <div className="rounded-full border border-solid p-1 flex items-center justify-center">
            <img src={piece.logoUrl} className="w-5 h-5"></img>
          </div>
          <div className="text-sm">{piece.displayName}</div>
          <div className="flex-grow"></div>
          {!hasCode && (
            <Button
              size={'sm'}
              variant={'basic'}
              disabled={!readyToConect}
              onClick={async () =>
                openPopup(
                  redirectUrl!,
                  form.getValues().request.value.client_id,
                )
              }
            >
              Connect
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
              Disconnect
            </Button>
          )}
        </div>

        {ownAuthEnabled && currentOAuth2Type !== AppConnectionType.OAUTH2 && (
          <div>
            <Button
              size="sm"
              variant={'link'}
              className="text-xs"
              onClick={() => setOAuth2Type(AppConnectionType.OAUTH2)}
            >
              I would like to use my own App Credentials
            </Button>
          </div>
        )}
        {currentOAuth2Type === AppConnectionType.OAUTH2 && (
          <div>
            <Button
              size="sm"
              variant={'link'}
              className="text-xs"
              onClick={() => setOAuth2Type(AppConnectionType.CLOUD_OAUTH2)}
            >
              I would like to use predefined App Credentials
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
};

OAuth2ConnectionSettings.displayName = 'OAuth2ConnectionSettings';
export { OAuth2ConnectionSettings };
