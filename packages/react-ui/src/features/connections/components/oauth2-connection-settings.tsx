import { typeboxResolver } from '@hookform/resolvers/typebox';
import { Static, Type } from '@sinclair/typebox';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { appConnectionUtils } from '@/features/connections/lib/app-connections-utils';
import { authenticationSession } from '@/lib/authentication-session';
import { OAuth2Property, OAuth2Props, PieceMetadataModelSummary, PropertyType } from '@activepieces/pieces-framework';
import {
  ApEdition,
  ApFlagId,
  AppConnectionType,
  UpsertCloudOAuth2Request,
  UpsertOAuth2Request,
  UpsertPlatformOAuth2Request,
  isNil,
} from '@activepieces/shared';
import { oauth2Utils } from '@/lib/oauth2-utils';
import { Button } from '@/components/ui/button';
import { flagsHooks } from '@/hooks/flags-hooks';
import { useQueryClient } from '@tanstack/react-query';
import { oauth2AppsHooks } from '../lib/oauth2-apps-hooks';
import { platformHooks } from '@/hooks/platform-hooks';

type OAuth2ConnectionSettingsProps = {
  onChange: (request: UpsertCloudOAuth2Request | UpsertOAuth2Request | UpsertPlatformOAuth2Request | null, valid: boolean) => void;
  connectionName?: string;
  piece: PieceMetadataModelSummary;
  authProperty: OAuth2Property<OAuth2Props>;
};

const formSchema = Type.Object({
  connectionName: Type.String({
    errorMessage: 'This field is required',
    minLength: 1,
  }),
  clientId: Type.String({
    errorMessage: 'This field is required',
    minLength: 1,
  }),
  clientSecret: Type.String({
    errorMessage: 'This field is required',
    minLength: 1,
  }),
  oauth2Response: Type.Object({
    code: Type.String({
      minLength: 1,
    }),
    code_challenge: Type.Optional(Type.String({})),
  }, {
    errorMessage: 'This field is required',
  })
})

type FormSchema = Static<typeof formSchema>;
const OAuth2ConnectionSettings = ({
  onChange,
  connectionName,
  authProperty,
  piece,
}: OAuth2ConnectionSettingsProps) => {

  const queryClient = useQueryClient();
  const { data: platform } = platformHooks.useCurrentPlatform();
  const [readyToConect, setReadyToConect] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [currentOAuth2Type, setOAuth2Type] = useState<AppConnectionType.CLOUD_OAUTH2 | AppConnectionType.OAUTH2 | AppConnectionType.PLATFORM_OAUTH2 | undefined>(undefined);
  const { data: thirdPartyUrl } = flagsHooks.useFlag<string>(ApFlagId.THIRD_PARTY_AUTH_PROVIDER_REDIRECT_URL, queryClient);
  const { data: pieceToClientIdMap } = oauth2AppsHooks.usePieceToClientIdMap(platform.cloudAuthEnabled);
  const { data: ownAuthEnabled } = flagsHooks.useFlag<ApEdition>(ApFlagId.OWN_AUTH2_ENABLED, queryClient);

  const redirectUrl = currentOAuth2Type === AppConnectionType.CLOUD_OAUTH2 ? 'https://secrets.activepieces.com/redirect' : thirdPartyUrl;
  const suggestedConnectionName = connectionName ?? appConnectionUtils.findName(piece.name);

  const form = useForm<FormSchema>({
    defaultValues: {
      clientId: undefined,
      connectionName: suggestedConnectionName,
    },
    resolver: typeboxResolver(formSchema),
  });

  const watchedForm = form.watch();
  useEffect(() => {
    const baseCriteria = !isNil(redirectUrl) && !isNil(form.getValues().clientId)
    const hasClientSecret = isNil(form.getValues().clientSecret)
    setReadyToConect(baseCriteria && (currentOAuth2Type !== AppConnectionType.OAUTH2 || hasClientSecret));
  }, [watchedForm]);

  useEffect(() => {
    if (isNil(currentOAuth2Type) && !isNil(pieceToClientIdMap)) {
      setOAuth2Type(pieceToClientIdMap?.[piece.name]?.type ?? AppConnectionType.OAUTH2);
      return;
    }
    form.setValue('clientSecret', currentOAuth2Type === AppConnectionType.OAUTH2 ? '' : 'FAKE_SECRET');
    form.setValue('clientId', currentOAuth2Type === AppConnectionType.OAUTH2 ? '' : (pieceToClientIdMap?.[piece.name].clientId ?? ''));
    updateRequest();
  }, [currentOAuth2Type, pieceToClientIdMap]);

  useEffect(() => {
    updateRequest();
  }, [refresh]);


  async function openPopup(redirectUrl: string, clientId: string) {
    const { code, codeChallenge } = await oauth2Utils.openOAuth2Popup({
      authUrl: authProperty.authUrl,
      clientId,
      redirectUrl,
      scope: authProperty.scope.join(' '),
      pkce: authProperty.pkce ?? false,
      extraParams: authProperty.extra ?? {},
    })
    form.setValue('oauth2Response', { code, code_challenge: codeChallenge }, { shouldValidate: true });
    setRefresh(refresh + 1);
  }

  async function updateRequest() {
    await form.trigger();
    const request = createRequest(form.formState.isValid, currentOAuth2Type,);
    onChange(request, form.formState.isValid);
  }


  function createRequest(valid: boolean, type: AppConnectionType | undefined): UpsertOAuth2Request | UpsertPlatformOAuth2Request | UpsertCloudOAuth2Request | null {
    if (!valid || !type) {
      return null;
    }
    const { connectionName, clientId, clientSecret, oauth2Response: { code, code_challenge } } = form.getValues();
    const commonData = {
      name: connectionName,
      pieceName: piece.name,
      projectId: authenticationSession.getProjectId(),
      value: {
        client_id: clientId,
        authorization_method: authProperty.authorizationMethod,
        code,
        code_challenge,
        props: {},
        scope: authProperty.scope.join(' '),
      },
    };
    switch (type) {
      case AppConnectionType.CLOUD_OAUTH2:
        return {
          ...commonData,
          type: AppConnectionType.CLOUD_OAUTH2,
          value: {
            ...commonData.value,
            type: AppConnectionType.CLOUD_OAUTH2,
          },
        };
      case AppConnectionType.OAUTH2:
        return {
          ...commonData,
          type: AppConnectionType.OAUTH2,
          value: {
            ...commonData.value,
            client_secret: clientSecret,
            redirect_url: redirectUrl!,
            type: AppConnectionType.OAUTH2,
          },
        };
      case AppConnectionType.PLATFORM_OAUTH2:
        return {
          ...commonData,
          type: AppConnectionType.PLATFORM_OAUTH2,
          value: {
            ...commonData.value,
            redirect_url: redirectUrl!,
            type: AppConnectionType.PLATFORM_OAUTH2,
          },
        };
      default:
        return null;
    }
  }

  return (
    <Form {...form}>
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => e.preventDefault()}
      >
        <FormField
          name="connectionName"
          control={form.control}
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <div className="text-md font-medium">Connection Name</div>
              <Input
                {...field}
                onChange={(e) => {
                  field.onChange(e);
                  updateRequest();
                }}
                type="text"
                placeholder="Connection name"
              />
              <FormMessage />
            </FormItem>
          )}
        ></FormField>
        {currentOAuth2Type === AppConnectionType.OAUTH2 && <>
          <FormField
            name="clientId"
            control={form.control}
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <div className="text-md font-medium">Client ID</div>
                <Input
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                    updateRequest();
                  }}
                  type="text"
                  placeholder="Client ID"
                />
                <FormMessage />
              </FormItem>
            )}
          ></FormField>
          <FormField
            name="clientSecret"
            control={form.control}
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <div className="text-md font-medium">Client Secret</div>
                <Input
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                    updateRequest();
                  }}
                  type="text"
                  placeholder="Client Secret"
                />
                <FormMessage />
              </FormItem>
            )}
          ></FormField>
        </>}

        <div className='border border-solid p-2 rounded-lg gap-2 flex text-center items-center justify-center h-ful'>
          <div className="rounded-full border border-solid p-1 flex items-center justify-center">
            <img src={piece.logoUrl} className='w-5 h-5'></img>
          </div>
          <div className='text-sm'>
            {piece.displayName}
          </div>
          <div className='flex-grow'></div>
          {!form.getValues().oauth2Response?.code && <Button size={"sm"} variant={"basic"} disabled={!readyToConect} onClick={async () => openPopup(redirectUrl!, form.getValues().clientId)}>Connect</Button>}
          {form.getValues().oauth2Response?.code && <Button size={"sm"} variant={"basic"} className="text-destructive" onClick={() => {
            form.setValue('oauth2Response', { code: '', code_challenge: undefined });
            updateRequest();
          }}>Disconnect</Button>}
        </div>
        {ownAuthEnabled && currentOAuth2Type !== AppConnectionType.OAUTH2 && <div>
          <Button size="sm" variant={"link"} className='text-xs' onClick={() => setOAuth2Type(AppConnectionType.OAUTH2)}>I would like to use my own App Credentials</Button>
        </div>}
        {currentOAuth2Type === AppConnectionType.OAUTH2 && <div>
          <Button size="sm" variant={"link"} className='text-xs' onClick={() => setOAuth2Type(AppConnectionType.CLOUD_OAUTH2)}>I would like to use predefined App Credentials</Button>
        </div>}

      </form>
    </Form>
  );
};

OAuth2ConnectionSettings.displayName = 'OAuth2ConnectionSettings';
export { OAuth2ConnectionSettings };