import { getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { IntercomClient } from 'intercom-client';
import {
  AppConnectionValueForAuthProperty,
  Property,
} from '@activepieces/pieces-framework';
import { AppConnectionType } from '@activepieces/shared';
import { intercomAuth } from '../../index';

export type IntercomAuthValue = AppConnectionValueForAuthProperty<
  typeof intercomAuth
>;

export function getIntercomToken(auth: IntercomAuthValue): string {
  if (auth.type === AppConnectionType.CUSTOM_AUTH) {
    return auth.props.accessToken;
  }
  return getAccessTokenOrThrow(auth);
}

export function getIntercomRegion(auth: IntercomAuthValue): string {
  if (auth.type === AppConnectionType.CUSTOM_AUTH) {
    return auth.props.region;
  }
  return (auth.props?.['region'] as string) ?? 'intercom';
}

export const intercomClient = (auth: IntercomAuthValue) => {
  const client = new IntercomClient({
    token: getIntercomToken(auth),
    environment: `https://api.${getIntercomRegion(auth)}.io`,
  });
  return client;
};

export const commonProps = {
  admins: <R extends boolean>(options: { displayName: string; required: R }) =>
    Property.Dropdown<string, R, typeof intercomAuth>({
      auth: intercomAuth,
      displayName: options.displayName,
      required: options.required,
      options: async ({ auth }) => {
        if (!auth) {
          return {
            options: [],
            disabled: true,
            placeholder: 'Please connect your account first',
          };
        }
        const client = intercomClient(auth as IntercomAuthValue);
        const adminsResponse = await client.admins.list();

        return {
          options: adminsResponse.admins.map((c) => {
            const res = { value: c.id, label: '' };
            if (c.name) {
              res.label = c.name;
            } else if (c.email) {
              res.label = c.email;
            } else {
              res.label = c.id;
            }
            return res;
          }),
        };
      },
      refreshers: [],
    }),
  contacts: <R extends boolean>(options: {
    displayName: string;
    required: R;
  }) =>
    Property.Dropdown<string, R, typeof intercomAuth>({
      auth: intercomAuth,
      displayName: options.displayName,
      required: options.required,
      options: async ({ auth }) => {
        if (!auth) {
          return {
            options: [],
            disabled: true,
            placeholder: 'Please connect your account first',
          };
        }
        const client = intercomClient(auth);
        const contactsResponse = await client.contacts.list({});

        return {
          options: contactsResponse.data.map((c) => {
            const res = { value: c.id, label: '' };
            if (c.name) {
              res.label = c.name;
            } else if (c.email) {
              res.label = c.email;
            } else {
              res.label = c.id;
            }
            return res;
          }),
        };
      },
      refreshers: [],
    }),
};

export type Operator =
  | '='
  | '!='
  | 'IN'
  | 'NIN'
  | '<'
  | '>'
  | '~'
  | '!~'
  | '^'
  | '$';

export type TriggerPayload = {
  type: string;
  app_id: string;
  id: string;
  topic: string;
  data: {
    type: string;
    item: Record<string, any>;
  };
};
