export enum ActivepiecesClientEventName {
  CLIENT_INIT = 'CLIENT_INIT',
  CLIENT_ROUTE_CHANGED = 'CLIENT_ROUTE_CHANGED',
  CLIENT_NEW_CONNECTION_DIALOG_CLOSED = 'CLIENT_NEW_CONNECTION_DIALOG_CLOSED',
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
export interface ActivepiecesNewConnectionDialogClosed {
  type: ActivepiecesClientEventName.CLIENT_NEW_CONNECTION_DIALOG_CLOSED;
  data: { connection?: { id: string; name: string } };
}

type IframeWithWindow = HTMLIFrameElement & { contentWindow: Window };

export const NEW_CONNECTION_QUERY_PARAMS = {
  name: 'pieceName',
};
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
    hideLogoInBuilder?: boolean;
    hideFlowNameInBuilder?: boolean;
    disableNavigationInBuilder: boolean;
    hideFolders?: boolean;
    isCustomNavigationHandlingEnabled?: boolean
  };
}
export const _AP_JWT_TOKEN_QUERY_PARAM_NAME = "jwtToken"

class ActivepiecesEmbedded {
  _prefix = '';
  _initialRoute = '';
  _instanceUrl = '';
  _hideSidebar = false;
  _hideFolders = false;
  _hideLogoInBuilder = false;
  _hideFlowNameInBuilder = false;
  _jwtToken = '';
  _disableNavigationInBuilder = true;
  readonly _CONNECTIONS_IFRAME_ID='ApConnectionsIframe';
  _resolveNewConnectionDialogClosed?: (result: ActivepiecesNewConnectionDialogClosed['data']) => void;
  _dashboardAndBuilderIframeWindow?: Window;
  _navigationHandler?: (data: { route: string }) => void;
  _parentOrigin = window.location.origin;
  readonly _MAX_CONTAINER_CHECK_COUNT = 100;
  readonly _HUNDRED_MILLISECONDS = 100;
  configure({
    prefix,
    jwtToken,
    instanceUrl,
    embedding,
  }: {
    prefix?: string;
    instanceUrl: string;
    jwtToken: string;
    embedding?: {
      containerId?: string;
      builder?: {
        disableNavigation?: boolean;
        hideLogo?: boolean;
        hideFlowName?: boolean;
      };
      dashboard?: {
        hideSidebar?: boolean;
      };
      hideFolders?: boolean;
      navigation?:{
        handler?: (data: { route: string }) => void;
      }
    };
  }) {
    this._prefix = prefix || '/';
    const newInitialRoute = !window.location.pathname.startsWith(this._prefix)
      ? '/'
      : '/' + window.location.pathname.substring(this._prefix.length);
    this._initialRoute = newInitialRoute || '/';
    this._hideSidebar = embedding?.dashboard?.hideSidebar || false;
    this._instanceUrl = this._removeTrailingSlashes(instanceUrl);
    this._disableNavigationInBuilder =
      embedding?.builder?.disableNavigation ?? false;
    this._hideFolders = embedding?.hideFolders ?? false;
    this._hideLogoInBuilder = embedding?.builder?.hideLogo ?? false;
    this._hideFlowNameInBuilder = embedding?.builder?.hideFlowName ?? false;
    this._jwtToken = jwtToken;
    this._navigationHandler = embedding?.navigation?.handler;
    if (embedding?.containerId) {
      this._initializeBuilderAndDashboardIframe({
        containerSelector: `#${embedding.containerId}`,
        jwtToken,
      });
    }
    this._checkIfNewConnectionDialogClosed();
  }

  private _initializeBuilderAndDashboardIframe = ({
    containerSelector,
    jwtToken,
  }: {
    containerSelector: string;
    jwtToken: string;
  }) => {
    this._addGracePeriodBeforeMethod({
      condition: () => {
        return !!document.querySelector(containerSelector);
      },
      method: () => {
        const iframeContainer = document.querySelector(containerSelector);
        if (iframeContainer) {
          const iframeWindow = this.connectToEmbed({
            jwtToken,
            iframeContainer,
          }).contentWindow;
          this._dashboardAndBuilderIframeWindow = iframeWindow;
          if(!this._navigationHandler){
            this._checkForVendorRouteChanges();
          }
          this._checkForClientRouteChanges(iframeWindow);
        }
      },
      errorMessage: 'container not found',
    });
  };

  private connectToEmbed({ jwtToken, iframeContainer, callbackAfterAuthentication }: {
    jwtToken: string,
    iframeContainer: Element,
    callbackAfterAuthentication?: () => void
  }
  ): IframeWithWindow {
    const iframe = this._createIframe({ src: `${this._instanceUrl}/embed?${_AP_JWT_TOKEN_QUERY_PARAM_NAME}=${jwtToken}` });
    iframeContainer.appendChild(iframe);
    if (!this._doesFrameHaveWindow(iframe)) {
      const error = 'Activepieces: iframe window not accessible';
      console.error(error);
      throw new Error(error);
    }
    const iframeWindow = iframe.contentWindow;
    window.addEventListener(
      'message',
      (event: MessageEvent<ActivepiecesClientEvent>) => {
        if (event.source === iframeWindow) {
          switch (event.data.type) {
            case ActivepiecesClientEventName.CLIENT_INIT: {
              const apEvent: ActivepiecesVendorInit = {
                type: ActivepiecesVendorEventName.VENDOR_INIT,
                data: {
                  prefix: this._prefix,
                  initialRoute: this._initialRoute,
                  hideSidebar: this._hideSidebar,
                  disableNavigationInBuilder: this._disableNavigationInBuilder,
                  hideFolders: this._hideFolders,
                  hideLogoInBuilder: this._hideLogoInBuilder,
                  hideFlowNameInBuilder: this._hideFlowNameInBuilder,
                  isCustomNavigationHandlingEnabled: !!this._navigationHandler
                },
              };
              iframeWindow.postMessage(apEvent, '*');
              if (callbackAfterAuthentication) {
                callbackAfterAuthentication();
              }
              break;
            }
          }
        }
      }
    );
    return iframe;
  }

  private _createIframe({ src }: { src: string }) {
    const iframe = document.createElement('iframe');
    iframe.src = src;
    iframe.setAttribute('allow','clipboard-read; clipboard-write');
    return iframe;
  }

  async connect({ pieceName }: { pieceName: string }) {
    return this._addGracePeriodBeforeMethod({
      condition: () => {
        return !!document.body;
      },
      method: () => {
        const connectionsIframe = this.connectToEmbed({ jwtToken: this._jwtToken, iframeContainer: document.body, 
          callbackAfterAuthentication: () => {
              connectionsIframe.style.display = 'block';
              const apEvent: ActivepiecesVendorRouteChanged = {
                type: ActivepiecesVendorEventName.VENDOR_ROUTE_CHANGED,
                data: {
                  //added date so angular queryparams will be updated and open the dialog, because if you try to create two connections with the same piece, the second one will not open the dialog
                  vendorRoute: `/embed/connections?${NEW_CONNECTION_QUERY_PARAMS.name}=${pieceName}&date=${Date.now()}`
                },
              };
              connectionsIframe.contentWindow.postMessage(apEvent, '*');
            } });
          const connectionsIframeStyle = ['display:none', 'position:fixed', 'top:0', 'left:0', 'width:100%', 'height:100%', 'border:none'].join(';');
          connectionsIframe.style.cssText = connectionsIframeStyle;
          connectionsIframe.id = this._CONNECTIONS_IFRAME_ID;
          return new Promise<ActivepiecesNewConnectionDialogClosed['data']>((resolve) => {
            this._resolveNewConnectionDialogClosed = resolve;
          });
        },
      errorMessage: 'document body not found while trying to add connections iframe'
    });
  }


   navigate({ route }: { route: string }) {
      if(!this._dashboardAndBuilderIframeWindow){
        console.error('Activepieces: dashboard iframe not found');
        return;
      }
      const event: ActivepiecesVendorRouteChanged = {
        type: ActivepiecesVendorEventName.VENDOR_ROUTE_CHANGED,
        data: {
          vendorRoute: route,
        },
      };
      this._dashboardAndBuilderIframeWindow.postMessage(event, '*');
  }

  private _checkForClientRouteChanges = (source: Window) => {
    window.addEventListener(
      'message',
      (event: MessageEvent<ActivepiecesClientRouteChanged>) => {
        if (
          event.data.type ===
            ActivepiecesClientEventName.CLIENT_ROUTE_CHANGED &&
          event.source === source
        ) {
          let prefixStartsWithSlash = this._prefix.startsWith('/')
            ? this._prefix
            : `/${this._prefix}`;
          if (prefixStartsWithSlash === '/') {
            prefixStartsWithSlash = '';
          }
          let routeWithPrefix = prefixStartsWithSlash + event.data.data.route;
          if (!routeWithPrefix.startsWith('/')) {
            routeWithPrefix = '/' + routeWithPrefix;
          }
       
          if(this._navigationHandler)
            {
              window.history.replaceState({}, document.title, location.pathname);
              this._navigationHandler({ route: routeWithPrefix });
            }
            else
            {
              window.history.replaceState({}, '', routeWithPrefix);
            }
        }
      }
    );
  };

  private _checkForVendorRouteChanges = () => {
    let currentRoute = window.location.href;
    setInterval(() => {
      if (currentRoute !== window.location.href) {
        currentRoute = window.location.href;
        const prefixStartsWithSlash = this._prefix.startsWith('/');
       const route = this._extractRouteAfterPrefix(
        currentRoute,
        prefixStartsWithSlash
          ? this._parentOrigin + this._prefix
          : `${this._parentOrigin}/${this._prefix}`
      );
      this.navigate({route});
      }
    }, 50);
  };

  private _extractRouteAfterPrefix(href: string, prefix: string) {
    return href.split(prefix)[1];
  }
  private _doesFrameHaveWindow(
    frame: HTMLIFrameElement
  ): frame is IframeWithWindow {
    return frame.contentWindow !== null;
  }
  private _checkIfNewConnectionDialogClosed() {
    window.addEventListener(
      'message',
      (event: MessageEvent<ActivepiecesNewConnectionDialogClosed>) => {
        if(event.data.type === ActivepiecesClientEventName.CLIENT_NEW_CONNECTION_DIALOG_CLOSED)
          {
            if (this._resolveNewConnectionDialogClosed) {
              this._resolveNewConnectionDialogClosed(event.data.data);
            }
            const connectionsIframe = document.getElementById(this._CONNECTIONS_IFRAME_ID);
            if(connectionsIframe) {
                connectionsIframe.remove();
              }
            else {
              console.warn("Activepieces: connections iframe not found when trying to remove it ")
              }
          }
   
      }
    );
  }

  private _removeTrailingSlashes(str: string) {
    return str.endsWith('/') ? str.slice(0, -1) : str;
  }
  /**Adds a grace period before executing the method depending on the condition */
  private _addGracePeriodBeforeMethod({
    method,
    condition,
    errorMessage,
  }: {
    method: () => void;
    condition: () => boolean;
    /**Error message to show when grace period passes */
    errorMessage: string;
  }) {
    return new Promise((resolve, reject) => {
      let checkCounter = 0;
      if (condition()) {
        resolve(method());
        return;
      }
      const checker = setInterval(() => {
        if (checkCounter >= this._MAX_CONTAINER_CHECK_COUNT) {
          console.error(`Activepieces: ${errorMessage}`);
          reject(`Activepieces: ${errorMessage}`);
          return;
        }
        checkCounter++;
        if (condition()) {
          console;
          clearInterval(checker);
          resolve(method());
        }
      }, this._HUNDRED_MILLISECONDS);
    },);

  }
}


(window as any).activepieces = new ActivepiecesEmbedded();
(window as any).ActivepiecesEmbedded =  ActivepiecesEmbedded;