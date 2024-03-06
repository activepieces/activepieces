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
  data:{ newConnectionId?:string } 
}

type IframeWithWindow = HTMLIFrameElement & {contentWindow: Window}

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
  };
}
export const jwtTokenQueryParamName = "jwtToken"


class ActivepiecesEmbedded {
  _prefix = '';
  _initialRoute = '';
  _instanceUrl = '';
  _hideSidebar = false;
  _disableNavigationInBuilder = true;
  handleVendorNavigation?: (data: { route: string }) => void;
  handleClientNavigation?: (data: { route: string }) => void;
  parentOrigin = window.location.origin;
  private createIframe({src,style}:{src:string,style:string})
  {
    const iframe = document.createElement('iframe');
    iframe.src = src;
    iframe.style.cssText = style;
    return iframe;
  }
  private connectoToEmbed ({instanceUrl,jwtToken,iframeContainer,iframeStyling,client,name}: {
    instanceUrl: string,
    jwtToken: string,
    iframeStyling: string | undefined,
    iframeContainer: Element,
    client: ActivepiecesEmbedded,
    name:string
  }
  ): IframeWithWindow {
    const iframe = this.createIframe({src:`${instanceUrl}/embed?${jwtTokenQueryParamName}=${jwtToken}`,style:iframeStyling || ''});
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
                    initialRoute:  client._initialRoute,
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
    this._instanceUrl = instanceUrl;
    this._disableNavigationInBuilder = disableNavigationInBuilder === undefined ? true : disableNavigationInBuilder;
    this.initializeBuilderIframe({
      client: this,
      builderIframeContainerSelector,
      instanceUrl,
      jwtToken,
      iframeStyling
    });

 
  }

  connect({pieceName}:{pieceName:string}) {
    if (!this._connectionsIframe || !this.doesFrameHaveWindow(this._connectionsIframe)) {
      console.error('Activepieces: connections iframe not found');
      return;
      }
       const apEvent: ActivepiecesVendorRouteChanged = {
         type: ActivepiecesVendorEventName.VENDOR_ROUTE_CHANGED,
         data: {
          //added date so angular queryparams will be updated and open the dialog, because if you try to create two connections with the same piece, the second one will not open the dialog
           vendorRoute:`/embed/connections?${NEW_CONNECTION_QUERY_PARAMS.name}=${pieceName}&date=${Date.now()}`
         },
       };
    this._connectionsIframe.contentWindow.postMessage(apEvent, '*');
    this._connectionsIframe.style.display = 'block';
 
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
   const iframeWindow = this.connectoToEmbed({instanceUrl, jwtToken, iframeStyling, iframeContainer, client,name:'builder'}).contentWindow;
   const connectionsIframeStyle=['display:none','position:fixed','top:0','left:0','width:100%','height:100%','border:none'].join(';');
   this._connectionsIframe= this.connectoToEmbed({instanceUrl, jwtToken, iframeStyling:connectionsIframeStyle, iframeContainer:document.body, client,name:'connections'});
   this.checkForVendorRouteChanges(iframeWindow, client);
   this.checkForClientRouteChanges(client,iframeWindow);
   this.checkIfNewConnectionDialogClosed();
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
 checkIfNewConnectionDialogClosed() {
 
    window.addEventListener(
      'message',
      (event: MessageEvent<ActivepiecesNewConnectionDialogClosed>)=> {
        if(this._connectionsIframe && this.doesFrameHaveWindow(this._connectionsIframe))
        {
        if (
          event.data.type === ActivepiecesClientEventName.CLIENT_NEW_CONNECTION_DIALOG_CLOSED
     
        ) {
          this._connectionsIframe.style.display = 'none';
        }
      }
  }

    );
 
};
}

(window as any).activepieces = new ActivepiecesEmbedded();
