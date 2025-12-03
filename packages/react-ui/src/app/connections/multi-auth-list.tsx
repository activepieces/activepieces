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
  OAuth2App,
  PiecesOAuth2AppsMap,
  oauth2Utils,
} from '@/lib/oauth2-utils';
import { formatUtils } from '@/lib/utils';
import {
  OAuth2Property,
  PieceAuthProperty,
  PropertyType,
  DEFAULT_CONNECTION_DISPLAY_NAME,
} from '@activepieces/pieces-framework';
import {
  AppConnectionType,
  BOTH_CLIENT_CREDENTIALS_AND_AUTHORIZATION_CODE,
  OAuth2GrantType,
} from '@activepieces/shared';

export function MutliAuthList({
  pieceAuth,
  setSelectedItem,
  confirmSelectedItem,
  piecesOAuth2AppsMap,
  pieceName,
  selectedItem,
}: MutliAuthListProps) {
  const authItems: RadioGroupListItem<AuthListItem>[] = pieceAuth.flatMap(
    (auth) => {
      const displayName = getDisplayName(auth);
      if (auth.type === PropertyType.OAUTH2) {
        const predefinedOAuth2App = oauth2Utils.getPredefinedOAuth2App(
          piecesOAuth2AppsMap,
          pieceName,
        );
        return createOAuth2Options(auth, displayName, predefinedOAuth2App);
      }

      return {
        label: displayName,
        value: { authProperty: auth, grantType: null, oauth2App: null },
        description: auth.description,
      };
    },
  );

  const selectedOption = authItems.find((auth) =>
    deepEqual(auth.value, selectedItem),
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
        onChange={setSelectedItem}
        value={selectedOption?.value ?? null}
      />
      <DialogFooter className="mt-4">
        <div className="mx-5 w-full flex justify-end gap-2">
          <DialogClose asChild>
            <Button variant="outline">{t('Cancel')}</Button>
          </DialogClose>
          <Button variant="default" onClick={() => confirmSelectedItem()}>
            {t('Continue')}
          </Button>
        </div>
      </DialogFooter>
    </>
  );
}

const getDisplayName = (auth: PieceAuthProperty): string => {
  if (
    auth.displayName !== DEFAULT_CONNECTION_DISPLAY_NAME &&
    auth.type !== PropertyType.OAUTH2
  ) {
    return auth.displayName;
  } else if (auth.type === PropertyType.OAUTH2) {
    return 'OAuth2';
  }
  return formatUtils.convertEnumToHumanReadable(auth.type);
};

function createOAuth2Options(
  auth: OAuth2Property<any>,
  displayName: string,
  predefinedOAuth2App: OAuth2App | null,
): RadioGroupListItem<AuthListItem>[] {
  const options: RadioGroupListItem<AuthListItem>[] = [];
  const grantType = auth.grantType ?? OAuth2GrantType.AUTHORIZATION_CODE;

  const emptyOAuth2App: OAuth2App = {
    oauth2Type: AppConnectionType.OAUTH2,
    clientId: null,
  };

  if (
    predefinedOAuth2App &&
    (grantType === OAuth2GrantType.AUTHORIZATION_CODE ||
      grantType === BOTH_CLIENT_CREDENTIALS_AND_AUTHORIZATION_CODE)
  ) {
    options.push({
      label: `${displayName} ${t('(Easiest)')}`,
      value: {
        authProperty: auth,
        grantType: OAuth2GrantType.AUTHORIZATION_CODE,
        oauth2App: predefinedOAuth2App,
      },
      description: t(
        'Use a predefined OAuth2 app for authentication, no extra configuration needed.',
      ),
    });
  }

  if (
    grantType === OAuth2GrantType.AUTHORIZATION_CODE ||
    grantType === BOTH_CLIENT_CREDENTIALS_AND_AUTHORIZATION_CODE
  ) {
    options.push({
      label: `${displayName} ${t('(Advanced)')}`,
      value: {
        authProperty: auth,
        grantType: OAuth2GrantType.AUTHORIZATION_CODE,
        oauth2App: emptyOAuth2App,
      },
      description: t(
        'This option gives you full control over the authentication process by using your own OAuth2 app credentials.',
      ),
    });
  }

  if (
    grantType === OAuth2GrantType.CLIENT_CREDENTIALS ||
    grantType === BOTH_CLIENT_CREDENTIALS_AND_AUTHORIZATION_CODE
  ) {
    options.push({
      label: `${displayName} ${t('(Client Credentials Grant)')}`,
      value: {
        authProperty: auth,
        grantType: OAuth2GrantType.CLIENT_CREDENTIALS,
        oauth2App: emptyOAuth2App,
      },
      description: t(
        'Create a connection without having to use a personal account.',
      ),
    });
  }

  return options;
}

export type AuthListItem =
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

type MutliAuthListProps = {
  pieceAuth: PieceAuthProperty[];
  setSelectedItem: (auth: AuthListItem) => void;
  confirmSelectedItem: () => void;
  piecesOAuth2AppsMap: PiecesOAuth2AppsMap;
  selectedItem: AuthListItem;
  pieceName: string;
};
