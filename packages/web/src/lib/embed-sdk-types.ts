// Local replacement for the deleted ee-embed-sdk package.
// Keeps the embed routes working without any EE dependency.

export const ActivepiecesClientEventName = {
  CLIENT_INIT: 'CLIENT_INIT',
  CLIENT_ROUTE_CHANGED: 'CLIENT_ROUTE_CHANGED',
  CLIENT_AUTHENTICATION_SUCCESS: 'CLIENT_AUTHENTICATION_SUCCESS',
  CLIENT_AUTHENTICATION_FAILED: 'CLIENT_AUTHENTICATION_FAILED',
  CLIENT_CONFIGURATION_FINISHED: 'CLIENT_CONFIGURATION_FINISHED',
  CLIENT_NEW_CONNECTION_DIALOG_CLOSED: 'CLIENT_NEW_CONNECTION_DIALOG_CLOSED',
  CLIENT_SHOW_CONNECTION_IFRAME: 'CLIENT_SHOW_CONNECTION_IFRAME',
  CLIENT_CONNECTION_PIECE_NOT_FOUND: 'CLIENT_CONNECTION_PIECE_NOT_FOUND',
  CLIENT_CONNECTION_NAME_IS_INVALID: 'CLIENT_CONNECTION_NAME_IS_INVALID',
  CLIENT_BUILDER_HOME_BUTTON_CLICKED: 'CLIENT_BUILDER_HOME_BUTTON_CLICKED',
} as const;

export const ActivepiecesVendorEventName = {
  VENDOR_INIT: 'VENDOR_INIT',
  VENDOR_ROUTE_CHANGED: 'VENDOR_ROUTE_CHANGED',
} as const;

export const NEW_CONNECTION_QUERY_PARAMS = {
  name: 'name',
  connectionName: 'connectionName',
  randomId: 'randomId',
} as const;

type ClientEventName = typeof ActivepiecesClientEventName;
type VendorEventName = typeof ActivepiecesVendorEventName;

export type ActivepiecesClientInit = {
  type: ClientEventName['CLIENT_INIT'];
  data: Record<string, never>;
};

export type ActivepiecesClientAuthenticationSuccess = {
  type: ClientEventName['CLIENT_AUTHENTICATION_SUCCESS'];
  data: Record<string, never>;
};

export type ActivepiecesClientAuthenticationFailed = {
  type: ClientEventName['CLIENT_AUTHENTICATION_FAILED'];
  data: Error;
};

export type ActivepiecesClientConfigurationFinished = {
  type: ClientEventName['CLIENT_CONFIGURATION_FINISHED'];
  data: Record<string, never>;
};

export type ActivepiecesClientShowConnectionIframe = {
  type: ClientEventName['CLIENT_SHOW_CONNECTION_IFRAME'];
  data: Record<string, never>;
};

export type ActivepiecesNewConnectionDialogClosed = {
  type: ClientEventName['CLIENT_NEW_CONNECTION_DIALOG_CLOSED'];
  data: {
    connection?: { id: string; name: string };
  };
};

export type ActivepiecesClientConnectionPieceNotFound = {
  type: ClientEventName['CLIENT_CONNECTION_PIECE_NOT_FOUND'];
  data: { error: string };
};

export type ActivepiecesClientConnectionNameIsInvalid = {
  type: ClientEventName['CLIENT_CONNECTION_NAME_IS_INVALID'];
  data: { error: string };
};

export type ActivepiecesVendorInit = {
  type: VendorEventName['VENDOR_INIT'];
  data: {
    jwtToken?: string;
    mode?: 'dark' | 'light' | 'system';
    locale?: string;
    initialRoute?: string;
    hideSidebar?: boolean;
    hideFlowNameInBuilder?: boolean;
    disableNavigationInBuilder?: boolean | 'keep_home_button_only';
    hideFolders?: boolean;
    hideTables?: boolean;
    sdkVersion?: string;
    fontUrl?: string;
    fontFamily?: string;
    hideExportAndImportFlow?: boolean;
    emitHomeButtonClickedEvent?: boolean;
    homeButtonIcon?: string;
    hideDuplicateFlow?: boolean;
    hideFlowsPageNavbar?: boolean;
    hidePageHeader?: boolean;
  };
};

export type ActivepiecesVendorRouteChanged = {
  type: VendorEventName['VENDOR_ROUTE_CHANGED'];
  data: { vendorRoute: string };
};
