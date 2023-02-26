import { PropertyType } from '@activepieces/shared';
import { DropdownState } from '../../../flow-builder/service/action-meta.service';

export interface PieceConfig {
  key: string;
  type: PropertyType;
  label: string;
  value?: any;
  description?: string;
  authUrl?: string;
  tokenUrl?: string;
  redirectUrl?: string;
  scope?: string[];
  required: boolean;
  extra?: Record<string, unknown>;
  refreshers?: string[];
  basicAuthConfigs?: {
    password: Pick<PieceProperty, 'displayName' | 'description'>;
    username: Pick<PieceProperty, 'displayName' | 'description'>;
  };
  oAuthProps?: Record<
    string,
    Pick<PieceProperty, 'displayName' | 'description' | 'type' | 'options'>
  >;
  staticDropdownState?: DropdownState<unknown>;
  defaultValue?: unknown;
}

export class PieceProperty {
  name: string;
  description: string;
  type: PropertyType;
  required: boolean;
  displayName: string;
  authUrl?: string;
  tokenUrl?: string;
  scope?: string[];
  extra?: Record<string, unknown>;
  refreshers?: string[];
  password?: PieceProperty;
  username?: PieceProperty;
  props?: Record<string, PieceProperty>;
  options?: DropdownState<unknown>;
  defaultValue?: unknown;
}

export const propsConvertor = {
  convertToFrontEndConfig: (name: string, prop: PieceProperty): PieceConfig => {
    const pieceConfig: PieceConfig = {
      key: name,
      type: prop.type,
      label: prop.displayName,
      description: prop.description,
      authUrl: prop.authUrl,
      tokenUrl: prop.tokenUrl,
      scope: prop.scope,
      required: prop.required,
      extra: prop.extra,
      refreshers: prop.refreshers,
      staticDropdownState: prop.options,
      defaultValue: prop.defaultValue,
    };
    if (prop.username && prop.password) {
      pieceConfig.basicAuthConfigs = {
        password: prop.password,
        username: prop.username,
      };
    }
    if (prop.props) {
      pieceConfig.oAuthProps = { ...prop.props };
    }
    return pieceConfig;
  },
};

export interface AppPiece {
  name: string;
  logoUrl: string;
  actions: propMap;
  triggers: propMap;
  displayName: string;
  description?: string;
}

type propMap = Record<
  string,
  {
    displayName: string;
    description: string;
    props: Record<string, PieceProperty>;
    sampleData?: object;
    type?: 'POLLING' | 'WEBHOOK';
  }
>;
