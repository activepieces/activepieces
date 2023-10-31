
export enum ActivepiecesClientEventName {
  CLIENT_INIT = "CLIENT_INIT",
  CLIENT_ROUTE_CHANGED = "CLIENT_ROUTE_CHANGED",
}
export interface ActivepiecesClientInit {
  type: ActivepiecesClientEventName.CLIENT_INIT;
}
export interface ActivepiecesClientRouteChanged {
  type: ActivepiecesClientEventName.CLIENT_ROUTE_CHANGED;
  data: {
    route: string;
  };
}


export  type ActivepiecesClientEvent =
  | ActivepiecesClientInit
  | ActivepiecesClientRouteChanged;

  export enum ActivepiecesVendorEventName {
    VENDOR_INIT = "VENDOR_INIT",
    VENDOR_ROUTE_CHANGED = "VENDOR_ROUTE_CHANGED",
  }

  
  export  interface ActivepiecesVendorRouteChanged {
    type: ActivepiecesVendorEventName.VENDOR_ROUTE_CHANGED;
    data: {
        vendorRoute: string;
    };
  }
  
  export interface ActivepiecesVendorInit {
    type: ActivepiecesVendorEventName.VENDOR_INIT;
    data: {
        prefix: string;
        initialClientRoute:string
    };
  }
  export const hideSidebarQueryParamName = "hideSidebar"