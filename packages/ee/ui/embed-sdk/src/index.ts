//Client ==> Activepieces
//Vendor ==> Customers using our embed sdk
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
  CLIENT_BUILDER_HOME_BUTTON_CLICKED = 'CLIENT_BUILDER_HOME_BUTTON_CLICKED',
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
export interface ActivepiecesBuilderHomeButtonClicked {
  type: ActivepiecesClientEventName.CLIENT_BUILDER_HOME_BUTTON_CLICKED;
  data: {
    route: string;
  };
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
    hideSidebar: boolean;
    hideFlowNameInBuilder?: boolean;
    disableNavigationInBuilder: boolean | 'keep_home_button_only';
    hideFolders?: boolean;
    sdkVersion?: string;
    jwtToken: string;
    initialRoute?: string 
    fontUrl?: string;
    fontFamily?: string;
    hideExportAndImportFlow?: boolean;
    hideDuplicateFlow?: boolean;
    homeButtonIcon?: 'back' | 'logo';
    emitHomeButtonClickedEvent?: boolean;
    locale?: string;
    mode?: 'light' | 'dark';
    hideFlowsPageNavbar?: boolean;
    hidePageHeader?: boolean;
  };
}



type newWindowFeatures = {
  height?: number,
  width?: number,
  top?: number,
  left?: number,
}
type EmbeddingParam = {
  containerId?: string;
  styling?: {
    fontUrl?: string;
    fontFamily?: string;
    mode?: 'light' | 'dark';
  };
  locale?:string;
  builder?: {
    disableNavigation?: boolean;
    hideFlowName?: boolean;
    homeButtonIcon: 'back' | 'logo';
    homeButtonClickedHandler?: (data: {
      route: string;
    }) => void;
  };
  dashboard?: {
    hideSidebar?: boolean;
    hideFlowsPageNavbar?: boolean;
    hidePageHeader?: boolean;
  };
  hideExportAndImportFlow?: boolean;
  hideDuplicateFlow?: boolean;
  hideFolders?: boolean;
  navigation?: {
    handler?: (data: { route: string }) => void;
  }
}
type ConfigureParams = {
  instanceUrl: string;
  jwtToken: string;
  prefix?: string;
  embedding?: EmbeddingParam;
}

type RequestMethod = Required<Parameters<typeof fetch>>[1]['method'];
class ActivepiecesEmbedded {
  readonly _sdkVersion = "0.8.0";
  //used for  Automatically Sync URL feature i.e /org/1234
  _prefix = '/';
  _instanceUrl = '';
  //this is used to authenticate embedding for the first time
  _jwtToken = '';
  _resolveNewConnectionDialogClosed?: (result: ActivepiecesNewConnectionDialogClosed['data']) => void;
  _dashboardAndBuilderIframeWindow?: Window;
  _rejectNewConnectionDialogClosed?: (error: unknown) => void;
  _handleVendorNavigation?: (data: { route: string }) => void;
  _handleClientNavigation?: (data: { route: string }) => void;
  _parentOrigin = window.location.origin;
  readonly _MAX_CONTAINER_CHECK_COUNT = 100;
  readonly _HUNDRED_MILLISECONDS = 100;
  _embeddingAuth?: {
    //this is used to do authentication with the backend
    userJwtToken:string,
    platformId:string,
    projectId:string
  };
  _embeddingState?: EmbeddingParam;
  configure({
    jwtToken,
    instanceUrl,
    embedding,
    prefix,
  }: ConfigureParams) {
    this._instanceUrl = this._removeTrailingSlashes(instanceUrl);
    this._jwtToken = jwtToken;
    this._prefix = this._removeTrailingSlashes(this._prependForwardSlashToRoute(prefix ?? '/'));
    this._embeddingState = embedding;
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
            this._checkForBuilderHomeButtonClicked(iframeWindow);
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
      if (event.source === targetWindow && event.origin === new URL(this._instanceUrl).origin) {
        switch (event.data.type) {
          case ActivepiecesClientEventName.CLIENT_INIT: {
            const apEvent: ActivepiecesVendorInit = {
              type: ActivepiecesVendorEventName.VENDOR_INIT,
              data: {
                hideSidebar: this._embeddingState?.dashboard?.hideSidebar ?? false,
                hideFlowsPageNavbar: this._embeddingState?.dashboard?.hideFlowsPageNavbar ?? false,
                disableNavigationInBuilder: this._embeddingState?.builder?.disableNavigation ?? false,
                hideFolders: this._embeddingState?.hideFolders ?? false,
                hideFlowNameInBuilder: this._embeddingState?.builder?.hideFlowName ?? false,
                jwtToken: this._jwtToken,
                initialRoute,
                fontUrl: this._embeddingState?.styling?.fontUrl,
                fontFamily: this._embeddingState?.styling?.fontFamily,
                hideExportAndImportFlow: this._embeddingState?.hideExportAndImportFlow ?? false,
                emitHomeButtonClickedEvent: this._embeddingState?.builder?.homeButtonClickedHandler !== undefined,
                locale: this._embeddingState?.locale ?? 'en',
                sdkVersion: this._sdkVersion,
                homeButtonIcon: this._embeddingState?.builder?.homeButtonIcon ?? 'logo',
                hideDuplicateFlow: this._embeddingState?.hideDuplicateFlow ?? false,
                mode: this._embeddingState?.styling?.mode,
                hidePageHeader: this._embeddingState?.dashboard?.hidePageHeader ?? false,
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
    const iframe = this._createIframe({ src: `${this._instanceUrl}/embed?currentDate=${Date.now()}` });
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
        //don't check for window because (instanceof Window) is false for popups
        if(!(target instanceof HTMLIFrameElement)) {
          const checkClosed = setInterval(() => {
            if (target.closed) {
              clearInterval(checkClosed);
              if(this._resolveNewConnectionDialogClosed) {
                this._resolveNewConnectionDialogClosed({connection:undefined})
              }
            }
          }, 500);
        }
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

  private _prependForwardSlashToRoute(route: string) {
    return route.startsWith('/') ? route : `/${route}`;
  }
  private _checkForClientRouteChanges = (source: Window) => {
    window.addEventListener(
      'message',
      (event: MessageEvent<ActivepiecesClientRouteChanged>) => {
        if (
          event.data.type ===
          ActivepiecesClientEventName.CLIENT_ROUTE_CHANGED &&
          event.source === source && 
          this._embeddingState?.navigation?.handler         
        ) {
          const routeWithPrefix =  this._prefix + this._prependForwardSlashToRoute(event.data.data.route);
          this._embeddingState.navigation.handler({ route: routeWithPrefix });
          return;
        }
      }
    );
  };

  private _checkForBuilderHomeButtonClicked = (source: Window) => {
    window.addEventListener('message', (event: MessageEvent<ActivepiecesBuilderHomeButtonClicked>) => {
      if (event.data.type === ActivepiecesClientEventName.CLIENT_BUILDER_HOME_BUTTON_CLICKED && event.source === source) {
        this._embeddingState?.builder?.homeButtonClickedHandler?.(event.data.data);
      }
    });
  }

  private _extractRouteAfterPrefix(vendorUrl: string, parentOriginWithPrefix: string) {
    return vendorUrl.split(parentOriginWithPrefix)[1];
  }

  //used for  Automatically Sync URL feature 
  extractActivepiecesRouteFromUrl({ vendorUrl }: { vendorUrl: string }) {
    return this._extractRouteAfterPrefix(vendorUrl, this._removeTrailingSlashes(this._parentOrigin) + this._prefix);
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
  private _removeStartingSlashes(str: string) {
    return str.startsWith('/') ? str.slice(1) : str;
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
  private async fetchEmbeddingAuth(params:{jwtToken:string} | undefined) {
    if(this._embeddingAuth) {
      return this._embeddingAuth;
    }
    const jwtToken = params?.jwtToken?? this._jwtToken;
    if(!jwtToken) {
      this._errorCreator('jwt token not found');
    }
    const response = await this.request({path: '/managed-authn/external-token', method: 'POST', body: {
      externalAccessToken: jwtToken,
    }}, false)
    this._embeddingAuth = {
      userJwtToken: response.token,
      platformId: response.platformId,
      projectId: response.projectId,
    }
    return this._embeddingAuth;
  }




 async request({path, method, body, queryParams}:{path:string, method: RequestMethod, body?:Record<string, unknown>, queryParams?:Record<string, string>}, useJwtToken = true) {
    const headers:Record<string, string> = {
    }
    if(body) {
      headers['Content-Type'] = 'application/json'
    }
    if(useJwtToken) {
      const embeddingAuth = await this.fetchEmbeddingAuth({jwtToken: this._jwtToken});
      headers['Authorization'] = `Bearer ${embeddingAuth.userJwtToken}`
    }
    const queryParamsString = queryParams ? `?${new URLSearchParams(queryParams).toString()}` : '';
     return fetch(`${this._removeTrailingSlashes(this._instanceUrl)}/api/v1/${this._removeStartingSlashes(path)}${queryParamsString}`, {
      method,
      body: body ? JSON.stringify(body) : undefined,
      headers,
     }).then(res => res.json())
  }

}


(window as any).activepieces = new ActivepiecesEmbedded();
(window as any).ActivepiecesEmbedded = ActivepiecesEmbedded;