export enum ActivepiecesClientEventName {
  CLIENT_INIT = 'CLIENT_INIT',
  CLIENT_ROUTE_CHANGED = 'CLIENT_ROUTE_CHANGED',
  CLIENT_NEW_CONNECTION_DIALOG_CLOSED = 'CLIENT_NEW_CONNECTION_DIALOG_CLOSED',
  CLIENT_SHOW_CONNECTION_IFRAME = 'CLIENT_SHOW_CONNECTION_IFRAME',
  CLIENT_CONNECTION_NAME_IS_INVALID = 'CLIENT_CONNECTION_NAME_IS_INVALID',
  CLIENT_AUTHENTICATION_SUCCESS = 'CLIENT_AUTHENTICATION_SUCCESS',
  CLIENT_AUTHENTICATION_FAILED = 'CLIENT_AUTHENTICATION_FAILED',
  CLIENT_CONFIGURATION_FINISHED = 'CLIENT_CONFIGURATION_FINISHED',
  CLIENT_CONNECTION_PIECE_NOT_FOUND = 'CLIENT_CONNECTION_PIECE_NOT_FOUND',
}
export interface ActivepiecesClientInit {
  type: ActivepiecesClientEventName.CLIENT_INIT;
  data: Record<string, never>;
}
export interface ActivepiecesClientAuthenticationSuccess {
  type: ActivepiecesClientEventName.CLIENT_AUTHENTICATION_SUCCESS;
  data: Record<string, never>;
}
export interface ActivepiecesClientAuthenticationFailed {
  type: ActivepiecesClientEventName.CLIENT_AUTHENTICATION_FAILED;
  data: unknown;
}
// Added this event so in the future if we add another step between authentication and configuration finished, we can use this event to notify the parent
export interface ActivepiecesClientConfigurationFinished {
  type: ActivepiecesClientEventName.CLIENT_CONFIGURATION_FINISHED;
  data: Record<string, never>;
}
export interface ActivepiecesClientShowConnectionIframe {
  type: ActivepiecesClientEventName.CLIENT_SHOW_CONNECTION_IFRAME;
  data: Record<string, never>;
}
export interface ActivepiecesClientConnectionNameIsInvalid {
  type: ActivepiecesClientEventName.CLIENT_CONNECTION_NAME_IS_INVALID;
  data: {
    error: string;
  };
}

export interface ActivepiecesClientConnectionPieceNotFound {
  type: ActivepiecesClientEventName.CLIENT_CONNECTION_PIECE_NOT_FOUND;
  data: {
    error: string
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
  randomId: 'randomId'
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
    jwtToken?: string; // Added jwtToken here
    initialRoute?: string       //previously initialRoute was optional
    fontUrl?: string;
    fontFamily?: string;
  };
}
// We used to send JWT in query params, now we send it in local storage
export const _AP_JWT_TOKEN_QUERY_PARAM_NAME = "jwtToken"
type newWindowFeatures = {
  height?: number,
  width?: number,
  top?: number,
  left?: number,
}
export const _AP_MANAGED_TOKEN_LOCAL_STORAGE_KEY = "ap_managed_token"
class ActivepiecesEmbedded {
  readonly _sdkVersion = "0.3.5";
  _prefix = '';
  _instanceUrl = '';
  _hideSidebar = false;
  _hideFolders = false;
  _hideLogoInBuilder = false;
  _hideFlowNameInBuilder = false;
  _jwtToken = '';
  _disableNavigationInBuilder = true;
  _fontUrl?: string;
  _fontFamily?: string;
  _resolveNewConnectionDialogClosed?: (result: ActivepiecesNewConnectionDialogClosed['data']) => void;
  _dashboardAndBuilderIframeWindow?: Window;
  _navigationHandler?: (data: { route: string }) => void;
  _rejectNewConnectionDialogClosed?: (error: unknown) => void;
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
      styling?: {
        fontUrl?: string;
        fontFamily?: string;
      };
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
    this._fontUrl = embedding?.styling?.fontUrl;
    this._fontFamily = embedding?.styling?.fontFamily;
    this._navigationHandler = embedding?.navigation?.handler;
    if (embedding?.containerId) {
      return this._initializeBuilderAndDashboardIframe({
        containerSelector: `#${embedding.containerId}`
      });
    }
    return new Promise((resolve) => { resolve({ status: "success" }) });
  }

  private _initializeBuilderAndDashboardIframe = ({
    containerSelector
  }: {
    containerSelector: string
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
              iframeContainer,
              callbackAfterConfigurationFinished: () => {
                resolve({ status: "success" });
              },
              initialRoute: '/'
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

  private _setupInitialMessageHandler(targetWindow: Window, initialRoute: string, callbackAfterConfigurationFinished?: () => void) {
    const initialMessageHandler = (event: MessageEvent<ActivepiecesClientEvent>) => {
      if (event.source === targetWindow) {
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
                jwtToken: this._jwtToken,
                initialRoute,
                fontUrl: this._fontUrl,
                fontFamily: this._fontFamily,
              },
            };
            targetWindow.postMessage(apEvent, '*');
            this._createAuthenticationSuccessListener(targetWindow);
            this._createAuthenticationFailedListener(targetWindow);
            this._createConfigurationFinishedListener(targetWindow, callbackAfterConfigurationFinished);
            window.removeEventListener('message', initialMessageHandler);
            break;
          }
        }
      }
    };

    window.addEventListener('message', initialMessageHandler);
  }
  private connectToEmbed({ iframeContainer, initialRoute, callbackAfterConfigurationFinished }: {
    iframeContainer: Element,
    initialRoute: string,
    callbackAfterConfigurationFinished?: () => void
  }): IframeWithWindow {
    const iframe = this._createIframe({ src: `${this._instanceUrl}/embed` });
    iframeContainer.appendChild(iframe);
    if (!this._doesFrameHaveWindow(iframe)) {
      this._errorCreator('iframe window not accessible');
    }
    const iframeWindow = iframe.contentWindow;
    this._setupInitialMessageHandler(iframeWindow, initialRoute, callbackAfterConfigurationFinished);
    return iframe;
  }

  private _createConfigurationFinishedListener = (targetWindow: Window, callbackAfterConfigurationFinished?: () => void) => {
    const configurationFinishedHandler = (event: MessageEvent<ActivepiecesClientConfigurationFinished>) => {
      if (event.data.type === ActivepiecesClientEventName.CLIENT_CONFIGURATION_FINISHED && event.source === targetWindow) {
        this._logger().log('Configuration finished')
        if (callbackAfterConfigurationFinished) {
          callbackAfterConfigurationFinished();
        }
      }
    }
    window.addEventListener('message', configurationFinishedHandler);
  }

  private _createAuthenticationFailedListener = (targetWindow: Window) => {
    const authenticationFailedHandler = (event: MessageEvent<ActivepiecesClientAuthenticationFailed>) => {
        if (event.data.type === ActivepiecesClientEventName.CLIENT_AUTHENTICATION_FAILED && event.source === targetWindow) {
           this._errorCreator('Authentication failed',event.data.data);
      }
    }
    window.addEventListener('message', authenticationFailedHandler);
  }

  private _createAuthenticationSuccessListener = (targetWindow: Window) => {
    const authenticationSuccessHandler = (event: MessageEvent<ActivepiecesClientAuthenticationSuccess>) => {
      if (event.data.type === ActivepiecesClientEventName.CLIENT_AUTHENTICATION_SUCCESS && event.source === targetWindow) {
        this._logger().log('Authentication success')
        window.removeEventListener('message', authenticationSuccessHandler);
      }
    }
    window.addEventListener('message', authenticationSuccessHandler);
  }
  private _createIframe({ src }: { src: string }) {
    const iframe = document.createElement('iframe');
    iframe.src = src;
    iframe.setAttribute('allow', 'clipboard-read; clipboard-write');
    return iframe;
  }

  private _getNewWindowFeatures(requestedFeats:newWindowFeatures) {
    const windowFeats:newWindowFeatures = {
      height: 700,
      width: 700,
      top: 0,
      left: 0,
    }
    Object.keys(windowFeats).forEach((key) => {
      if(typeof requestedFeats === 'object' && requestedFeats[key as keyof newWindowFeatures]){
        windowFeats[key as keyof newWindowFeatures ] = requestedFeats[key as keyof typeof requestedFeats]
      }
    })
    return `width=${windowFeats.width},height=${windowFeats.height},top=${windowFeats.top},left=${windowFeats.left}`
  }
    
  private _addConnectionIframe({pieceName, connectionName}:{pieceName:string, connectionName?:string}) {
    const connectionsIframe = this.connectToEmbed({
      iframeContainer: document.body,
      initialRoute: `/embed/connections?${NEW_CONNECTION_QUERY_PARAMS.name}=${pieceName}&randomId=${Date.now()}&${NEW_CONNECTION_QUERY_PARAMS.connectionName}=${connectionName || ''}`
    });
    connectionsIframe.style.cssText = ['display:none', 'position:fixed', 'top:0', 'left:0', 'width:100%', 'height:100%', 'border:none'].join(';');
    return connectionsIframe;
  }

  private _openNewWindowForConnections({pieceName, connectionName,newWindow}:{pieceName:string, connectionName?:string, newWindow:newWindowFeatures}) {
    const popup = window.open(`${this._instanceUrl}/embed`, '_blank', this._getNewWindowFeatures(newWindow));
    if (!popup) {
      this._errorCreator('Failed to open popup window');
    }
    this._setupInitialMessageHandler(popup, `/embed/connections?${NEW_CONNECTION_QUERY_PARAMS.name}=${pieceName}&randomId=${Date.now()}&${NEW_CONNECTION_QUERY_PARAMS.connectionName}=${connectionName || ''}`);
    return popup;
  }
  async connect({ pieceName, connectionName, newWindow }: { 
    pieceName: string, 
    connectionName?: string, 
    newWindow?:{
      height?: number,
      width?: number,
      top?: number,
      left?: number,
    }
  }) {
    this._cleanConnectionIframe();
    return this._addGracePeriodBeforeMethod({
      condition: () => {
        return !!document.body;
      },
      method: async () => {
        const target = newWindow? this._openNewWindowForConnections({pieceName, connectionName,newWindow}) : this._addConnectionIframe({pieceName, connectionName});
        return new Promise<ActivepiecesNewConnectionDialogClosed['data']>((resolve, reject) => {
          this._resolveNewConnectionDialogClosed = resolve;
          this._rejectNewConnectionDialogClosed = reject;
          this._setConnectionIframeEventsListener(target);
        });
      },
      errorMessage: 'unable to add connection embedding'
    });
  }


  navigate({ route }: { route: string }) {
    if (!this._dashboardAndBuilderIframeWindow) {
      this._logger().error('dashboard iframe not found');
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
  private _cleanConnectionIframe = () => { };
  private _setConnectionIframeEventsListener(target: Window | HTMLIFrameElement ) {
    const connectionRelatedMessageHandler = (event: MessageEvent<ActivepiecesNewConnectionDialogClosed | ActivepiecesClientConnectionNameIsInvalid | ActivepiecesClientShowConnectionIframe | ActivepiecesClientConnectionPieceNotFound>) => {
      if (event.data.type) {
        switch (event.data.type) {
          case ActivepiecesClientEventName.CLIENT_NEW_CONNECTION_DIALOG_CLOSED: {
            if (this._resolveNewConnectionDialogClosed) {
              this._resolveNewConnectionDialogClosed(event.data.data);
            }
            this._removeEmbedding(target);
            window.removeEventListener('message', connectionRelatedMessageHandler);
            break;
          }
          case ActivepiecesClientEventName.CLIENT_CONNECTION_NAME_IS_INVALID:
          case ActivepiecesClientEventName.CLIENT_CONNECTION_PIECE_NOT_FOUND: {
            this._removeEmbedding(target);
            if (this._rejectNewConnectionDialogClosed) {
              this._rejectNewConnectionDialogClosed(event.data.data);
            }
            else {
               this._errorCreator(event.data.data.error);
            }
            window.removeEventListener('message', connectionRelatedMessageHandler);
            break;
          }
          case ActivepiecesClientEventName.CLIENT_SHOW_CONNECTION_IFRAME: {
            if (target instanceof HTMLIFrameElement) {
              target.style.display = 'block';
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
      this._removeEmbedding(target);
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
          this._logger().error(errorMessage);
          reject(errorMessage);
          return;
        }
        checkCounter++;
        if (condition()) {
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
  private _errorCreator(message: string,...args:any[]): never {
    this._logger().error(message,...args)
    throw new Error(`Activepieces: ${message}`,);
  }
  private _removeEmbedding(target:HTMLIFrameElement | Window) {
    if (target) {
      if (target instanceof HTMLIFrameElement) {
        target.remove();
      } else {
        target.close();
      }
    }
    else {
      this._logger().warn(`couldn't remove embedding`)
    }
  }
  private _logger() {
    return{
      log: (message: string, ...args: any[]) => {
        console.log(`Activepieces: ${message}`, ...args)
      },
      error: (message: string, ...args: any[]) => {
        console.error(`Activepieces: ${message}`, ...args)
      },
      warn: (message: string, ...args: any[]) => {
        console.warn(`Activepieces: ${message}`, ...args)
      }
    }
  }

}


(window as any).activepieces = new ActivepiecesEmbedded();
(window as any).ActivepiecesEmbedded = ActivepiecesEmbedded;