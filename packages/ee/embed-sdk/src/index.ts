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

type IframeWithWindow = HTMLIFrameElement & {contentWindow: Window}
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
  handleVendorNavigation?: (data: { route: string }) => void;
  handleClientNavigation?: (data: { route: string }) => void;
  parentOrigin = window.location.origin;
  private createIframe ({instanceUrl,jwtToken,iframeContainer,iframeStyling,client,initialRoute}: {
    instanceUrl: string,
    jwtToken: string,
    iframeStyling: string | undefined,
    iframeContainer: Element,
    client: ActivepiecesEmbedded,
    initialRoute?:string}
  ): IframeWithWindow {
    const iframe = document.createElement('iframe');
    iframe.src = `${instanceUrl}/embed?jwtToken=${jwtToken}`;
    console.log(iframeStyling)
    iframe.style.cssText = iframeStyling || '';
    iframeContainer.appendChild(iframe);
  
    if (!this.doesFrameHaveWindow(iframe)) {
      const error = 'Activepieces: iframe window not accessible';
      console.error(error);
      throw new Error(error);
    }
    const iframeWindow = iframe.contentWindow;
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
                  initialRoute: initialRoute || client._initialRoute,
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
     return iframe;
  };
  _connectionsIframe: HTMLIFrameElement | null = null;

  configure({
    prefix,
    hideSidebar,
    disableNavigationInBuilder,
    builderIframeContainerSelector,
    jwtToken,
    instanceUrl,
    iframeStyling
  }: {
    prefix?: string;
    hideSidebar?: boolean;
    disableNavigationInBuilder?: boolean;
    builderIframeContainerSelector:string;
    jwtToken:string;
    instanceUrl:string;
    iframeStyling?: string;
  }) {
    this._prefix = prefix || '/';
    const newInitialRoute = !window.location.pathname.startsWith(this._prefix) ? '/' : '/' + window.location.pathname.substring(this._prefix.length);
    this._initialRoute = newInitialRoute || '/';
    this._hideSidebar = hideSidebar || false;
    this._disableNavigationInBuilder = disableNavigationInBuilder === undefined ? true : disableNavigationInBuilder;
    this.initializeBuilderIframe({
      client: this,
      builderIframeContainerSelector,
      instanceUrl,
      jwtToken,
      iframeStyling
    });
    this._connectionsIframe= this.createIframe({instanceUrl, 
      jwtToken,
      iframeStyling:['display:none','position:fixed','top:0','left:0','width:100%','height:100%','border:none'].join(';'),
      iframeContainer: document.body,
      client:this,
      initialRoute:'/connections'});
  }

  openNewConnectionDialog() {
    if (!this._connectionsIframe || !this.doesFrameHaveWindow(this._connectionsIframe)) {
      console.error('Activepieces: connections iframe not found');
      return;
    }
    this._connectionsIframe.style.display = 'block';
    const apEvent: ActivepiecesVendorRouteChanged = {
      type: ActivepiecesVendorEventName.VENDOR_ROUTE_CHANGED,
      data: {
        vendorRoute: "/connections",
      },
    };
    this._connectionsIframe.contentWindow.postMessage(apEvent, '*');
  }
  private initializeBuilderIframe = ({client,builderIframeContainerSelector, instanceUrl,jwtToken, iframeStyling}
    :{client: ActivepiecesEmbedded,
     builderIframeContainerSelector:string,
     instanceUrl:string,
      jwtToken:string,
      iframeStyling?:string }) => {
   const iframeContainer = document.querySelector(builderIframeContainerSelector);
   if(!iframeContainer) {
    console.error('Activepieces: iframe container not found');
    return;
   }
   const iframeWindow = this.createIframe({instanceUrl, jwtToken, iframeStyling, iframeContainer, client}).contentWindow;
   this.checkForVendorRouteChanges(iframeWindow, client);
   this.checkForClientRouteChanges(client,iframeWindow);
 };
 
 private checkForClientRouteChanges = (client: ActivepiecesEmbedded,source:Window) => {
   window.addEventListener(
     'message',
     function (event: MessageEvent<ActivepiecesClientRouteChanged>) {
       if (
         event.data.type === ActivepiecesClientEventName.CLIENT_ROUTE_CHANGED
         && event.source === source
     
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
 
 private checkForVendorRouteChanges = (
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
           vendorRoute: this.extractRouteAfterPrefix(
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
 
  private extractRouteAfterPrefix(href: string, prefix: string) {
   return href.split(prefix)[1];
 }
 private doesFrameHaveWindow(frame: HTMLIFrameElement): frame is IframeWithWindow {
   return frame.contentWindow !== null;
 }

}





(window as any).activepieces = new ActivepiecesEmbedded();
