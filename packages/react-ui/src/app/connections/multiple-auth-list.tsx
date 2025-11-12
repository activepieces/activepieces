import deepEqual from 'deep-equal';
import { t } from 'i18next';

import {
  RadioGroupList,
  RadioGroupListItem,
} from '@/components/custom/radio-group-list';
import { Button } from '@/components/ui/button';
import {
  DialogClose,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  getPredefinedOAuth2App,
  PieceToClientIdMap,
} from '@/features/connections/lib/oauth-apps-hooks';
import { OAuth2App } from '@/lib/oauth2-utils';
import { formatUtils } from '@/lib/utils';
import {
  OAuth2Property,
  PieceAuthProperty,
  PropertyType,
  DEFAULT_CONNECTION_DISPLAY_NAME,
} from '@activepieces/pieces-framework';
import {
  isNil,
  AppConnectionType,
  BOTH_CLIENT_CREDENTIALS_AND_AUTHORIZATION_CODE,
  OAuth2GrantType,
} from '@activepieces/shared';

export type SelectedAuth =
  | {
      authProperty: Exclude<PieceAuthProperty, OAuth2Property<any>>;
      grantType: null;
      oauth2App: null;
    }
  | {
      authProperty: OAuth2Property<any>;
      grantType: OAuth2GrantType;
      oauth2App: OAuth2App;
    };

export const MutlipleAuthList = ({
  pieceAuth,
  setSelectedAuth,
  confirmSelectedAuth,
  pieceToClientIdMap,
  pieceName,
  selectedAuth,
}: {
  pieceAuth: PieceAuthProperty[];
  setSelectedAuth: (auth: SelectedAuth) => void;
  confirmSelectedAuth: () => void;
  pieceToClientIdMap: PieceToClientIdMap;
  selectedAuth: SelectedAuth;
  pieceName: string;
}) => {
  const authItems: RadioGroupListItem<SelectedAuth>[] = pieceAuth
    .map((auth) => {
      return {
        ...auth,
        displayName:
          auth.displayName === DEFAULT_CONNECTION_DISPLAY_NAME
            ? auth.type === PropertyType.OAUTH2
              ? 'OAuth2'
              : formatUtils.convertEnumToHumanReadable(auth.type)
            : auth.displayName,
      };
    })
    .flatMap(
      (
        auth,
      ):
        | (RadioGroupListItem<SelectedAuth> | null)[]
        | null
        | RadioGroupListItem<SelectedAuth> => {
        if (isNil(auth)) {
          return null;
        }
        if (auth.type === PropertyType.OAUTH2) {
          const predefinedOAuth2App = getPredefinedOAuth2App(
            pieceToClientIdMap,
            pieceName,
          );
          const predefinedAppOptionDescription = t(
            'Use a predefined OAuth2 app for authentication, no extra configuration needed',
          );
          const predefinedOAuth2AppOption: RadioGroupListItem<SelectedAuth> | null =
            predefinedOAuth2App
              ? {
                  label: `${auth.displayName}`,
                  value: {
                    authProperty: auth,
                    grantType: OAuth2GrantType.AUTHORIZATION_CODE,
                    oauth2App: predefinedOAuth2App,
                  },
                  description: predefinedAppOptionDescription,
                }
              : null;
          const clientCredentialsOptionDescription = t(
            'Create a connection without having to use a personal account.',
          );
          const clientCredentialsOption: RadioGroupListItem<SelectedAuth> = {
            label: `${auth.displayName} ${t('(Client Credentials Grant)')}`,
            value: {
              authProperty: auth,
              grantType: OAuth2GrantType.CLIENT_CREDENTIALS,
              oauth2App: {
                oauth2Type: AppConnectionType.OAUTH2,
                clientId: null,
              },
            },
            description: clientCredentialsOptionDescription,
          };
          const userAppCredentialsOptionDescription = t(
            'This option gives you full control over the authentication process by using your own OAuth2 app credentials',
          );
          const userAppCredentialsOption: RadioGroupListItem<SelectedAuth> = {
            label: `${auth.displayName} ${t('(Custom App Credentials)')}`,
            value: {
              authProperty: auth,
              grantType: OAuth2GrantType.AUTHORIZATION_CODE,
              oauth2App: {
                oauth2Type: AppConnectionType.OAUTH2,
                clientId: null,
              },
            },
            description: userAppCredentialsOptionDescription,
          };
          switch (auth.grantType) {
            case OAuth2GrantType.CLIENT_CREDENTIALS:
              return [clientCredentialsOption];
            case OAuth2GrantType.AUTHORIZATION_CODE:
            case undefined:
              return [predefinedOAuth2AppOption, userAppCredentialsOption];
            case BOTH_CLIENT_CREDENTIALS_AND_AUTHORIZATION_CODE:
              return [
                predefinedOAuth2AppOption,
                userAppCredentialsOption,
                clientCredentialsOption,
              ];
          }
        }
        return {
          label: auth.displayName,
          value: {
            authProperty: auth as Exclude<
              PieceAuthProperty,
              OAuth2Property<any>
            >,
            grantType: null,
            oauth2App: null,
          },
          description: auth.description,
        };
      },
    )
    .filter((auth): auth is RadioGroupListItem<SelectedAuth> => {
      return !isNil(auth);
    });
  const selectedOption = authItems.find((auth) =>
    deepEqual(auth.value, selectedAuth),
  );
  return (
    <>
      <DialogHeader className="mb-0">
        <DialogTitle className="px-5">
          <div className="flex items-center gap-2">
            {t('Choose Authentication Method')}
          </div>
        </DialogTitle>
      </DialogHeader>
      <RadioGroupList
        className="px-5 mt-5"
        items={authItems}
        onChange={setSelectedAuth}
        value={selectedOption?.value ?? null}
      />
      <DialogFooter className="mt-4">
        <div className="mx-5 w-full flex justify-end gap-2">
          <DialogClose asChild>
            <Button variant="outline">{t('Cancel')}</Button>
          </DialogClose>
          <Button variant="default" onClick={() => confirmSelectedAuth()}>
            {t('Continue')}
          </Button>
        </div>
      </DialogFooter>
    </>
  );
};
