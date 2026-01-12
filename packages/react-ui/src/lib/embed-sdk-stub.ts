// Stub for removed ee-embed-sdk
// These are placeholder implementations for the embed SDK that was removed

export enum ActivepiecesClientEventName {
  CLIENT_INIT = 'CLIENT_INIT',
  CLIENT_ROUTE_CHANGED = 'CLIENT_ROUTE_CHANGED',
  CLIENT_BUILDER_HOME_BUTTON_CLICKED = 'CLIENT_BUILDER_HOME_BUTTON_CLICKED',
}

export enum ActivepiecesVendorEventName {
  VENDOR_INIT = 'VENDOR_INIT',
  VENDOR_ROUTE_CHANGED = 'VENDOR_ROUTE_CHANGED',
}

export const activepieces = {
  configure: () => {},
  on: () => {},
  emit: () => {},
};

export default activepieces;
