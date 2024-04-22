export enum ActivepiecesClientEventName {
  CLIENT_INIT = 'CLIENT_INIT',
  CLIENT_ROUTE_CHANGED = 'CLIENT_ROUTE_CHANGED',
  CLIENT_NEW_CONNECTION_DIALOG_CLOSED = 'CLIENT_NEW_CONNECTION_DIALOG_CLOSED',
  CLIENT_SHOW_CONNECTION_IFRAME = 'CLIENT_SHOW_CONNECTION_IFRAME',
  CLIENT_CONNECTION_NAME_IS_INVALID = 'CLIENT_CONNECTION_NAME_IS_INVALID',
}
export const connectionNameRegex = '[A-Za-z0-9_\\-@\\+\\.]*'
export interface ActivepiecesClientInit {
  type: ActivepiecesClientEventName.CLIENT_INIT;
  data: Record<string,never>;
}
export interface ActivepiecesClientShowConnectionIframe {
  type: ActivepiecesClientEventName.CLIENT_SHOW_CONNECTION_IFRAME;
  data: Record<string,never>;
}
export interface ActivepiecesClientConnectionNameIsInvalid {
  type: ActivepiecesClientEventName.CLIENT_CONNECTION_NAME_IS_INVALID;
  data: {
    error: string;
  };
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
  connectionName: 'connectionName',
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
    hideSidebar: boolean;
    hideLogoInBuilder?: boolean;
    hideFlowNameInBuilder?: boolean;
    disableNavigationInBuilder: boolean;
    hideFolders?: boolean;
    sdkVersion?: string;
  };
}
export const _AP_JWT_TOKEN_QUERY_PARAM_NAME = "jwtToken"

class ActivepiecesEmbedded {
  readonly _sdkVersion = "0.3.0";
  _prefix = '';
  _instanceUrl = '';
  _hideSidebar = false;
  _hideFolders = false;
  _hideLogoInBuilder = false;
  _hideFlowNameInBuilder = false;
  _jwtToken = '';
  _disableNavigationInBuilder = true;
  readonly _CONNECTIONS_IFRAME_ID = 'ApConnectionsIframe';
  _resolveNewConnectionDialogClosed?: (result: ActivepiecesNewConnectionDialogClosed['data']) => void;
  _dashboardAndBuilderIframeWindow?: Window;
  _navigationHandler?: (data: { route: string }) => void;
  _rejectNewConnectionDialogClosed?: (error:unknown)=> void;
  _handleVendorNavigation?: (data: { route: string }) => void;
  _handleClientNavigation?: (data: { route: string }) => void;
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
      navigation?: {
        handler?: (data: { route: string }) => void;
      }
    };
  }) {
    this._prefix = prefix || '/';
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
     return this._initializeBuilderAndDashboardIframe({
        containerSelector: `#${embedding.containerId}`,
        jwtToken,
      });
    }
    return new Promise((resolve) => {resolve({ status: "success" })});
  }

  private _initializeBuilderAndDashboardIframe = ({
    containerSelector,
    jwtToken,
  }: {
    containerSelector: string;
    jwtToken: string;
  }) => {
    return new Promise((resolve, reject) => {
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
              callbackAfterAuthentication: ()=>{
                resolve({ status: "success" });
              }
            }).contentWindow;
            this._dashboardAndBuilderIframeWindow = iframeWindow;
            this._checkForClientRouteChanges(iframeWindow);
          }
          else {
            reject({
              status: "error",
              error: {
                message: 'container not found',
              },
            });
          }
        },
        errorMessage: 'container not found',
      });
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
      throw this._errorCreator('iframe window not accessible');
    }
    const iframeWindow = iframe.contentWindow;
    const initialMessageHandler =  (event: MessageEvent<ActivepiecesClientEvent>) => {
      if (event.source === iframeWindow) {
        switch (event.data.type) {
          case ActivepiecesClientEventName.CLIENT_INIT: {
            const apEvent: ActivepiecesVendorInit = {
              type: ActivepiecesVendorEventName.VENDOR_INIT,
              data: {
                prefix: this._prefix,
                hideSidebar: this._hideSidebar,
                disableNavigationInBuilder: this._disableNavigationInBuilder,
                hideFolders: this._hideFolders,
                hideLogoInBuilder: this._hideLogoInBuilder,
                hideFlowNameInBuilder: this._hideFlowNameInBuilder,
              },
            };
            iframeWindow.postMessage(apEvent, '*');
            if (callbackAfterAuthentication) {
              callbackAfterAuthentication();
            }
            window.removeEventListener('message', initialMessageHandler);
            break;
          }
        }
      }
    };
    window.addEventListener(
      'message',initialMessageHandler
     
    );
    return iframe;
  }

  private _createIframe({ src }: { src: string }) {
    const iframe = document.createElement('iframe');
    iframe.src = src;
    iframe.setAttribute('allow', 'clipboard-read; clipboard-write');
    return iframe;
  }

  async connect({ pieceName,connectionName }: { pieceName: string, connectionName?:string }) {
    this._cleanConnectionIframe();
    return this._addGracePeriodBeforeMethod({
      condition: () => {
        return !!document.body;
      },
      method: async () => {
        const connectionsIframe = this.connectToEmbed({ jwtToken: this._jwtToken, iframeContainer: document.body, 
          callbackAfterAuthentication: () => {
              const apEvent: ActivepiecesVendorRouteChanged = {
                type: ActivepiecesVendorEventName.VENDOR_ROUTE_CHANGED,
                data: {
                  //added date so angular queryparams will be updated and open the dialog, because if you try to create two connections with the same piece, the second one will not open the dialog
                  vendorRoute: `/embed/connections?${NEW_CONNECTION_QUERY_PARAMS.name}=${pieceName}&date=${Date.now()}&${NEW_CONNECTION_QUERY_PARAMS.connectionName}=${connectionName || ''}`
                },
              };
              connectionsIframe.contentWindow.postMessage(apEvent, '*');
              
            } });
          const connectionsIframeStyle = ['display:none', 'position:fixed', 'top:0', 'left:0', 'width:100%', 'height:100%', 'border:none'].join(';');
          connectionsIframe.style.cssText = connectionsIframeStyle;
          connectionsIframe.id = this._CONNECTIONS_IFRAME_ID;
          this._setConnectionIframeEventsListener();
          return new Promise<ActivepiecesNewConnectionDialogClosed['data']>((resolve,reject) => {
            this._resolveNewConnectionDialogClosed = resolve;
            this._rejectNewConnectionDialogClosed = reject;
          });
        },
      errorMessage: 'document body not found while trying to add connections iframe'
    });
  }


  navigate({ route }: { route: string }) {
    if (!this._dashboardAndBuilderIframeWindow) {
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

          if (this._navigationHandler) {

            this._navigationHandler({ route: routeWithPrefix });
          }

        }
      }
    );
  };



  private _extractRouteAfterPrefix(href: string, prefix: string) {
    return href.split(prefix)[1];
  }
  private _doesFrameHaveWindow(
    frame: HTMLIFrameElement
  ): frame is IframeWithWindow {
    return frame.contentWindow !== null;
  }
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private _cleanConnectionIframe = () =>{};
  private _setConnectionIframeEventsListener() {
    const connectionRelatedMessageHandler = (event: MessageEvent<ActivepiecesNewConnectionDialogClosed | ActivepiecesClientConnectionNameIsInvalid | ActivepiecesClientShowConnectionIframe>) => {
      if(event.data.type)
        {
        switch(event.data.type)
          {
            case ActivepiecesClientEventName.CLIENT_NEW_CONNECTION_DIALOG_CLOSED: {
              if (this._resolveNewConnectionDialogClosed) {
                this._resolveNewConnectionDialogClosed(event.data.data);
              }
              this._removeIframe(`#${this._CONNECTIONS_IFRAME_ID}`);
              window.removeEventListener('message', connectionRelatedMessageHandler);
              break;
            }
            case ActivepiecesClientEventName.CLIENT_CONNECTION_NAME_IS_INVALID: {
              this._removeIframe(`#${this._CONNECTIONS_IFRAME_ID}`);
              if(this._rejectNewConnectionDialogClosed)
                {
                  this._rejectNewConnectionDialogClosed(event.data.data);
                }
                else
                {
                  throw this._errorCreator(event.data.data.error);
                }
                window.removeEventListener('message', connectionRelatedMessageHandler);
              break;
            }
            case ActivepiecesClientEventName.CLIENT_SHOW_CONNECTION_IFRAME: {
              const connectionsIframe: HTMLElement | null = document.querySelector(`#${this._CONNECTIONS_IFRAME_ID}`);
              if(connectionsIframe)
              {
                connectionsIframe.style.display = 'block';
              }
              else {
                throw this._errorCreator('Connections iframe not found when trying to show it')
              }
              break;
            }
          }
        }
      
 
    }
    window.addEventListener(
      'message',
      connectionRelatedMessageHandler
    );
    this._cleanConnectionIframe = () => {
      window.removeEventListener('message', connectionRelatedMessageHandler);
      this._resolveNewConnectionDialogClosed = undefined;
      this._rejectNewConnectionDialogClosed = undefined;
      if(document.querySelector(`#${this._CONNECTIONS_IFRAME_ID}`))
      {
        this._removeIframe(`#${this._CONNECTIONS_IFRAME_ID}`);
      }
    }
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
    method: () => Promise<any> | void;
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

  extractActivepiecesRouteFromUrl({ vendorUrl }: { vendorUrl: string }) {
    const prefixStartsWithSlash = this._prefix.startsWith('/');
    return this._extractRouteAfterPrefix(vendorUrl, prefixStartsWithSlash
      ? this._parentOrigin + this._prefix
      : `${this._parentOrigin}/${this._prefix}`);
  }
  private _errorCreator(message: string) {
    console.error(`Activepieces: ${message}`)
    return new Error(`Activepieces: ${message}`);
  }
  private _removeIframe(selector: string)
  {
    const iframe = document.querySelector(selector);
    if(iframe)
    {
      iframe.remove();
    }
    else {
      console.warn(`Activepieces: iframe not found when trying to remove it`)
    }
  
  }

}


(window as any).activepieces = new ActivepiecesEmbedded();
(window as any).ActivepiecesEmbedded = ActivepiecesEmbedded;