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
  data: { connection?: { id: string; name: string } }
}

type IframeWithWindow = HTMLIFrameElement & { contentWindow: Window }

export const NEW_CONNECTION_QUERY_PARAMS = {
  name: 'pieceName'
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
    hideFolders?: boolean;
  };
}
export const jwtTokenQueryParamName = "jwtToken"

class ActivepiecesEmbedded {
  _prefix = '';
  _initialRoute = '';
  _instanceUrl = '';
  _hideSidebar = false;
  _hideFolders = false;
  _disableNavigationInBuilder = true;
  _connectionsIframeInitialized = false;
  _resolveNewConnectionDialogClosed?: (result: ActivepiecesNewConnectionDialogClosed['data']) => void;
  _handleVendorNavigation?: (data: { route: string }) => void;
  _handleClientNavigation?: (data: { route: string }) => void;
  _parentOrigin = window.location.origin;
  _connectionsIframe: HTMLIFrameElement | null = null;
  readonly MAX_CONTAINER_CHECK_COUNT = 100;
  readonly HUNDRED_MILLISECONDS = 100;
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
      containerId?: string,
      builder?: {
        disableNavigation: boolean
      },
      dashboard?: {
        hideSidebar?: boolean;
      },
      hideFolders?: boolean;
    },
  }) {
    this._prefix = prefix || '/';
    const newInitialRoute = !window.location.pathname.startsWith(this._prefix) ? '/' : '/' + window.location.pathname.substring(this._prefix.length);
    this._initialRoute = newInitialRoute || '/';
    this._hideSidebar = embedding?.dashboard?.hideSidebar || false;
    this._instanceUrl = this._removeTrailingSlashes(instanceUrl);
    this._disableNavigationInBuilder = embedding?.builder?.disableNavigation ?? false;
    this._hideFolders = embedding?.hideFolders ?? false;
    if (embedding?.containerId) {
      this._initializeBuilderAndDashboardIframe({
        containerSelector: `#${embedding.containerId}`,
        jwtToken
      });
    }
    this._initializeConnectionsIframe({ jwtToken });
  }


  private _initializeBuilderAndDashboardIframe = ({ containerSelector, jwtToken }
    : {
      containerSelector: string,
      jwtToken: string
    }) => {
      this._addGracePeriodBeforeMethod({
        condition: () => {
          return !!document.querySelector(containerSelector);
        },
        method: () => {
          const iframeContainer = document.querySelector(containerSelector);
          if(iframeContainer)
          {
            const iframeWindow = this.connectoToEmbed({ jwtToken, iframeContainer }).contentWindow;
            this._checkForVendorRouteChanges(iframeWindow);
            this._checkForClientRouteChanges(iframeWindow);
          }
        },
        errorMessage: 'container not found'
      })

  };


  private _initializeConnectionsIframe = ({ jwtToken }: { jwtToken: string }) => {

   return this._addGracePeriodBeforeMethod({
      condition: ()=>{
        return !!document.body;
      },
      method:()=>{
      this._connectionsIframe = this.connectoToEmbed({ jwtToken, iframeContainer: document.body, callbackAfterAuthentication: () => { this._connectionsIframeInitialized = true } });
      const connectionsIframeStyle = ['display:none', 'position:fixed', 'top:0', 'left:0', 'width:100%', 'height:100%', 'border:none'].join(';');
      this._connectionsIframe.style.cssText = connectionsIframeStyle;
      this._checkIfNewConnectionDialogClosed();
      },
      errorMessage:'document body not found while trying to add connections iframe'
    });

  }



  private connectoToEmbed({ jwtToken, iframeContainer, callbackAfterAuthentication }: {
    jwtToken: string,
    iframeContainer: Element,
    callbackAfterAuthentication?: () => void
  }
  ): IframeWithWindow {
    const iframe = this._createIframe({ src: `${this._instanceUrl}/embed?${jwtTokenQueryParamName}=${jwtToken}` });
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
                  hideFolders: this._hideFolders
                },
              };
              iframeWindow.postMessage(apEvent, '*');
              if (callbackAfterAuthentication) { callbackAfterAuthentication() }
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
    return iframe;
  }


  async connect({ pieceName }: { pieceName: string }) {

    return this._addGracePeriodBeforeMethod({
      errorMessage:'connections iframe not initialized',
      condition:()=>this._connectionsIframeInitialized,
      method:()=>{
        if (!this._connectionsIframe || !this._doesFrameHaveWindow(this._connectionsIframe)) {
          console.error('Activepieces: connections iframe not found, please make sure you enabled embedded dialiogs in the configure method');
          return;
        }
        const apEvent: ActivepiecesVendorRouteChanged = {
          type: ActivepiecesVendorEventName.VENDOR_ROUTE_CHANGED,
          data: {
            //added date so angular queryparams will be updated and open the dialog, because if you try to create two connections with the same piece, the second one will not open the dialog
            vendorRoute: `/embed/connections?${NEW_CONNECTION_QUERY_PARAMS.name}=${pieceName}&date=${Date.now()}`
          },
        };
        this._connectionsIframe.contentWindow.postMessage(apEvent, '*');
        this._connectionsIframe.style.display = 'block';
        return new Promise<ActivepiecesNewConnectionDialogClosed['data']>((resolve) => {
          this._resolveNewConnectionDialogClosed = resolve;
        });
      }
    });
      
  }


  private _checkForClientRouteChanges = (source: Window) => {
    window.addEventListener(
      'message',
      (event: MessageEvent<ActivepiecesClientRouteChanged>) => {
        if (
          event.data.type === ActivepiecesClientEventName.CLIENT_ROUTE_CHANGED
          && event.source === source

        ) {
          let prefixStartsWithSlash = this._prefix.startsWith('/') ? this._prefix : `/${this._prefix}`;
          if (prefixStartsWithSlash === '/') {
            prefixStartsWithSlash = ''
          }
          let routeWithPrefix = prefixStartsWithSlash + event.data.data.route;
          if (!routeWithPrefix.startsWith("/")) {
            routeWithPrefix = '/' + routeWithPrefix
          }
          if (!this._handleClientNavigation) {
            window.history.replaceState({}, '', routeWithPrefix);
          } else {
            this._handleClientNavigation({ route: routeWithPrefix });
          }
        }
      }
    );
  };

  private _checkForVendorRouteChanges = (
    iframeWindow: Window
  ) => {
    let currentRoute = window.location.href;
    setInterval(() => {
      if (currentRoute !== window.location.href) {
        currentRoute = window.location.href;
        if (this._handleVendorNavigation) {
          this._handleVendorNavigation({ route: currentRoute });
        }
        const prefixStartsWithSlash = this._prefix.startsWith('/');
        const apEvent: ActivepiecesVendorRouteChanged = {
          type: ActivepiecesVendorEventName.VENDOR_ROUTE_CHANGED,
          data: {
            vendorRoute: this._extractRouteAfterPrefix(
              currentRoute,
              prefixStartsWithSlash
                ? this._parentOrigin + this._prefix
                : `${this._parentOrigin}/${this._prefix}`
            ),
          },
        };
        iframeWindow.postMessage(apEvent, '*');
      }
    }, 50);
  };

  private _extractRouteAfterPrefix(href: string, prefix: string) {
    return href.split(prefix)[1];
  }
  private _doesFrameHaveWindow(frame: HTMLIFrameElement): frame is IframeWithWindow {
    return frame.contentWindow !== null;
  }
  private _checkIfNewConnectionDialogClosed() {

    window.addEventListener(
      'message',
      (event: MessageEvent<ActivepiecesNewConnectionDialogClosed>) => {
        if (this._connectionsIframe && this._doesFrameHaveWindow(this._connectionsIframe)) {
          if (
            event.data.type === ActivepiecesClientEventName.CLIENT_NEW_CONNECTION_DIALOG_CLOSED

          ) {
            this._connectionsIframe.style.display = 'none';
            if (this._resolveNewConnectionDialogClosed) {
              this._resolveNewConnectionDialogClosed(event.data.data)
            }
          }
        }
      }
    );
  }

  private _removeTrailingSlashes(str: string) {
    return str.endsWith('/') ? str.slice(0, -1) : str;
  }
 /**Adds a grace period before executing the method depending on the condition */
  private _addGracePeriodBeforeMethod( 
    { method, 
      condition,
      errorMessage } :
    { method:()=>void, 
      condition: ()=>boolean,
     /**Error message to show when grace period passes */
     errorMessage:string }
    )
  {
    return new Promise((resolve, reject) => {
      let checkCounter= 0;
      if(condition())
      {
        resolve(method());
        return;
      }
     const checker= setInterval(()=>{
        if(checkCounter>=this.MAX_CONTAINER_CHECK_COUNT)
        {
          console.error(`Activepieces: ${errorMessage}`);
          reject(`Activepieces: ${errorMessage}`);
          return;
        }
        checkCounter++;
        if(condition())
        {
          console
          clearInterval(checker);
          resolve(method());
        }
      }, this.HUNDRED_MILLISECONDS);
    },);
   
  }

}

(window as any).activepieces = new ActivepiecesEmbedded();
