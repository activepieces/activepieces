import { useMutation } from '@tanstack/react-query';
import React from 'react';
import { flushSync } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useEffectOnce } from 'react-use';

import { memoryRouter } from '@/app/router';
import { useEmbedding } from '@/components/embed-provider';
import { useTheme } from '@/components/theme-provider';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { authenticationSession } from '@/lib/authentication-session';
import { managedAuthApi } from '@/lib/managed-auth-api';
import { combinePaths } from '@/lib/utils';
import {
  _AP_JWT_TOKEN_QUERY_PARAM_NAME,
  ActivepiecesClientAuthenticationFailed,
  ActivepiecesClientAuthenticationSuccess,
  ActivepiecesClientConfigurationFinished,
  ActivepiecesClientEventName,
  ActivepiecesClientInit,
  ActivepiecesVendorEventName,
  ActivepiecesVendorInit,
  ActivepiecesVendorRouteChanged,
} from 'ee-embed-sdk';

const notifyVendorPostAuthentication = () => {
  const authenticationSuccessEvent: ActivepiecesClientAuthenticationSuccess = {
    type: ActivepiecesClientEventName.CLIENT_AUTHENTICATION_SUCCESS,
    data: {},
  };
  window.parent.postMessage(authenticationSuccessEvent, '*');
  const configurationFinishedEvent: ActivepiecesClientConfigurationFinished = {
    type: ActivepiecesClientEventName.CLIENT_CONFIGURATION_FINISHED,
    data: {},
  };
  window.parent.postMessage(configurationFinishedEvent, '*');
};

const handleVendorNavigation = ({ projectId }: { projectId: string }) => {
  const handleVendorRouteChange = (
    event: MessageEvent<ActivepiecesVendorRouteChanged>,
  ) => {
    if (
      event.source === window.parent &&
      event.data.type === ActivepiecesVendorEventName.VENDOR_ROUTE_CHANGED
    ) {
      const targetRoute = event.data.data.vendorRoute;
      const targetRouteRequiresProjectId =
        targetRoute.includes('/runs') ||
        targetRoute.includes('/flows') ||
        targetRoute.includes('/connections');
      if (!targetRouteRequiresProjectId) {
        memoryRouter.navigate(targetRoute);
      } else {
        memoryRouter.navigate(
          combinePaths({
            secondPath: targetRoute,
            firstPath: `/projects/${projectId}`,
          }),
        );
      }
    }
  };
  window.addEventListener('message', handleVendorRouteChange);
};

const handleClientNavigation = () => {
  memoryRouter.subscribe((state) => {
    const pathNameWithoutProjectOrProjectId = state.location.pathname.replace(
      /\/projects\/[^/]+/,
      '',
    );
    window.parent.postMessage(
      {
        type: ActivepiecesClientEventName.CLIENT_ROUTE_CHANGED,
        data: {
          route: pathNameWithoutProjectOrProjectId + state.location.search,
        },
      },
      '*',
    );
  });
};

const getExternalTokenFromSearchQuery = () => {
  return new URLSearchParams(window.location.search).get(
    _AP_JWT_TOKEN_QUERY_PARAM_NAME,
  );
};

const EmbedPage = React.memo(() => {
  const { setEmbedState, embedState } = useEmbedding();
  const { mutateAsync } = useMutation({
    mutationFn: async ({
      externalAccessToken,
      locale,
    }: {
      externalAccessToken: string;
      locale: string;
    }) => {
      const data = await managedAuthApi.generateApToken({
        externalAccessToken,
      });
      await i18n.changeLanguage(locale);
      return data;
    },
  });
  const { setTheme } = useTheme();
  const { i18n } = useTranslation();
  const initState = (event: MessageEvent<ActivepiecesVendorInit>) => {
    console.log('=== POSTMESSAGE DEBUG ===');
    console.log('Event received:', event);
    console.log('Event source:', event.source);
    console.log('Event data:', event.data);
    console.log('Parent window:', window.parent);
    
    if (
      event.source === window.parent &&
      event.data.type === ActivepiecesVendorEventName.VENDOR_INIT
    ) {
      console.log('VENDOR_INIT received, processing...');
      const token = event.data.data.jwtToken || getExternalTokenFromSearchQuery();
      console.log('Token found:', !!token);
      if (token) {
        if (event.data.data.mode) {
          setTheme(event.data.data.mode);
        }
        mutateAsync(
          {
            externalAccessToken: token,
            locale: event.data.data.locale ?? 'en',
          },
          {
            onSuccess: (data) => {
              console.log('PostMessage authentication successful:', data);
              authenticationSession.saveResponse(data, true);
              const initialRoute = event.data.data.initialRoute ?? '/';
              //must use it to ensure that the correct router in RouterProvider is used before navigation
              flushSync(() => {
                setEmbedState({
                  hideSideNav: event.data.data.hideSidebar,
                  isEmbedded: true,
                  hideFlowNameInBuilder:
                    event.data.data.hideFlowNameInBuilder ?? false,
                  disableNavigationInBuilder:
                    event.data.data.disableNavigationInBuilder !== false,
                  hideFolders: event.data.data.hideFolders ?? false,
                  sdkVersion: event.data.data.sdkVersion,
                  fontUrl: event.data.data.fontUrl,
                  fontFamily: event.data.data.fontFamily,
                  useDarkBackground:
                    initialRoute.startsWith('/embed/connections'),
                  hideExportAndImportFlow:
                    event.data.data.hideExportAndImportFlow ?? false,
                  hideHomeButtonInBuilder:
                    event.data.data.disableNavigationInBuilder ===
                    'keep_home_button_only'
                      ? false
                      : event.data.data.disableNavigationInBuilder,
                  emitHomeButtonClickedEvent:
                    event.data.data.emitHomeButtonClickedEvent ?? false,
                  homeButtonIcon: event.data.data.homeButtonIcon ?? 'logo',
                  hideDuplicateFlow: event.data.data.hideDuplicateFlow ?? false,
                  hideFlowsPageNavbar:
                    event.data.data.hideFlowsPageNavbar ?? false,
                });
              });
              memoryRouter.navigate(initialRoute);
              handleVendorNavigation({ projectId: data.projectId });
              handleClientNavigation();
              notifyVendorPostAuthentication();
            },
            onError: (error) => {
              console.error('PostMessage authentication failed:', error);
              const errorEvent: ActivepiecesClientAuthenticationFailed = {
                type: ActivepiecesClientEventName.CLIENT_AUTHENTICATION_FAILED,
                data: error,
              };
              window.parent.postMessage(errorEvent, '*');
            },
          },
        );
      } else {
        console.error('Token sent via the sdk is empty');
      }
    } else {
      console.log('Event ignored - not from parent or not VENDOR_INIT');
    }
  };

  useEffectOnce(() => {
    // Debug mobile vs desktop
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    console.log('=== EMBED DEBUG ===');
    console.log('Is Mobile:', isMobile);
    console.log('User Agent:', navigator.userAgent);
    console.log('URL Token:', getExternalTokenFromSearchQuery());
    console.log('Parent Window:', window.parent);

    // Try to authenticate immediately if token is in URL (for mobile compatibility)
    const urlToken = getExternalTokenFromSearchQuery();
    if (urlToken) {
      console.log('Found token in URL, authenticating immediately...');
      mutateAsync(
        {
          externalAccessToken: urlToken,
          locale: 'en',
        },
        {
          onSuccess: (data) => {
            console.log('URL authentication successful:', data);
            authenticationSession.saveResponse(data, true);
            const initialRoute = '/';
            flushSync(() => {
              setEmbedState({
                hideSideNav: false,
                isEmbedded: true,
                hideFlowNameInBuilder: false,
                disableNavigationInBuilder: false,
                hideFolders: false,
                useDarkBackground: false,
                hideExportAndImportFlow: false,
                hideHomeButtonInBuilder: false,
                emitHomeButtonClickedEvent: false,
                homeButtonIcon: 'logo',
                hideDuplicateFlow: false,
                hideFlowsPageNavbar: false,
              });
            });
            memoryRouter.navigate(initialRoute);
            handleVendorNavigation({ projectId: data.projectId });
            handleClientNavigation();
            notifyVendorPostAuthentication();
          },
          onError: (error) => {
            console.error('URL token authentication failed:', error);
          },
        },
      );
    } else {
      console.log('No token found in URL, waiting for postMessage...');
    }

    // Also listen for postMessage (for desktop SDK usage)
    const event: ActivepiecesClientInit = {
      type: ActivepiecesClientEventName.CLIENT_INIT,
      data: {},
    };
    window.parent.postMessage(event, '*');
    window.addEventListener('message', initState);
    return () => {
      window.removeEventListener('message', initState);
    };
  });
  return <LoadingScreen brightSpinner={embedState.useDarkBackground} />;
});

EmbedPage.displayName = 'EmbedPage';
export { EmbedPage };
