export enum ActivepiecesClientEventName {
  CLIENT_INIT = 'CLIENT_INIT',
  CLIENT_ROUTE_CHANGED = 'CLIENT_ROUTE_CHANGED',
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

export type ActivepiecesClientEvent =
  | ActivepiecesClientInit
  | ActivepiecesClientRouteChanged;

export enum ActivepiecesVendorEventName {
  VENDOR_INIT = 'VENDOR_INIT',
  VENDOR_ROUTE_CHANGED = 'VENDOR_ROUTE_CHANGED',
}

export interface ActivepiecesVendorRouteChanged {
  type: ActivepiecesVendorEventName.VENDOR_ROUTE_CHANGED;
  data: {
    vendorRoute: string;
  };
}

export interface ActivepiecesVendorInit {
  type: ActivepiecesVendorEventName.VENDOR_INIT;
  data: {
    prefix: string;
    initialRoute: string;
    hideSidebar: boolean;
    disableNavigationInBuilder: boolean;
  };
}
export const jwtTokenQueryParamName = "jwtToken"


class ActivepiecesEmbedded {
  _prefix = '';
  _initialRoute = '';
  _hideSidebar = false;
  _disableNavigationInBuilder = true;
  iframeParentOrigin = window.location.origin;
  handleVendorNavigation?: (data: { route: string }) => void;
  handleClientNavigation?: (data: { route: string }) => void;
  parentOrigin = window.location.origin;
  configure({
    prefix,
    hideSidebar,
    disableNavigationInBuilder
  }: {
    prefix?: string;
    hideSidebar?: boolean;
    disableNavigationInBuilder?: boolean;
  }) {
    this._prefix = prefix || '/';
    const newInitialRoute = !window.location.pathname.startsWith(this._prefix) ? '/' : '/' + window.location.pathname.substring(this._prefix.length);
    this._initialRoute = newInitialRoute || '/';
    this._hideSidebar = hideSidebar || false;
    this._disableNavigationInBuilder = disableNavigationInBuilder === undefined ? true : disableNavigationInBuilder;
    setIframeChecker(this);
  }
}

const setIframeChecker = (client: ActivepiecesEmbedded) => {
  const iframeChecker = setInterval(() => {
    const iframe = document.querySelector('iframe') as HTMLIFrameElement;
    const iframeWindow = iframe?.contentWindow;
    if (!iframeWindow) return;

    window.addEventListener(
      'message',
      function (event: MessageEvent<ActivepiecesClientEvent>) {
        if (event.source === iframeWindow) {
          switch (event.data.type) {
            case ActivepiecesClientEventName.CLIENT_INIT: {
              const apEvent: ActivepiecesVendorInit = {
                type: ActivepiecesVendorEventName.VENDOR_INIT,
                data: {
                  prefix: client._prefix,
                  initialRoute: client._initialRoute,
                  hideSidebar: client._hideSidebar,
                  disableNavigationInBuilder: client._disableNavigationInBuilder,
                },
              };
              iframeWindow.postMessage(apEvent, '*');
              break;
            }
          }
        }
      }
    );
    checkForVendorRouteChanges(iframeWindow, client);
    checkForClientRouteChanges(client);
    clearInterval(iframeChecker);
  });
};

const checkForClientRouteChanges = (client: ActivepiecesEmbedded) => {
  window.addEventListener(
    'message',
    function (event: MessageEvent<ActivepiecesClientRouteChanged>) {
      if (
        event.data.type === ActivepiecesClientEventName.CLIENT_ROUTE_CHANGED
      ) {
        let prefixStartsWithSlash = client._prefix.startsWith('/') ? client._prefix : `/${client._prefix}`;
        if (prefixStartsWithSlash === '/') {
          prefixStartsWithSlash = ''
        }
        let routeWithPrefix = prefixStartsWithSlash + event.data.data.route;
        if (!routeWithPrefix.startsWith("/")) {
          routeWithPrefix = '/' + routeWithPrefix
        }
        if (!client.handleClientNavigation) {
          this.history.replaceState({}, '', routeWithPrefix);
        } else {
          client.handleClientNavigation({ route: routeWithPrefix });
        }
      }
    }
  );
};

const checkForVendorRouteChanges = (
  iframeWindow: Window,
  client: ActivepiecesEmbedded
) => {
  let currentRoute = window.location.href;
  setInterval(() => {
    if (currentRoute !== window.location.href) {
      currentRoute = window.location.href;
      if (client.handleVendorNavigation) {
        client.handleVendorNavigation({ route: currentRoute });
      }
      const prefixStartsWithSlash = client._prefix.startsWith('/');
      const apEvent: ActivepiecesVendorRouteChanged = {
        type: ActivepiecesVendorEventName.VENDOR_ROUTE_CHANGED,
        data: {
          vendorRoute: extractRouteAfterPrefix(
            currentRoute,
            prefixStartsWithSlash
              ? client.parentOrigin + client._prefix
              : `${client.parentOrigin}/${client._prefix}`
          ),
        },
      };
      iframeWindow.postMessage(apEvent, '*');
    }
  }, 50);
};

function extractRouteAfterPrefix(href: string, prefix: string) {
  return href.split(prefix)[1];
}

(window as any).activepieces = new ActivepiecesEmbedded();
