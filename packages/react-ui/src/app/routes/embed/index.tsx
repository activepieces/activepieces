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
import { combinePaths, parentWindow } from '@/lib/utils';
import {
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
  parentWindow.postMessage(authenticationSuccessEvent, '*');
  const configurationFinishedEvent: ActivepiecesClientConfigurationFinished = {
    type: ActivepiecesClientEventName.CLIENT_CONFIGURATION_FINISHED,
    data: {},
  };
  parentWindow.postMessage(configurationFinishedEvent, '*');
};

const handleVendorNavigation = ({ projectId }: { projectId: string }) => {
  const handleVendorRouteChange = (
    event: MessageEvent<ActivepiecesVendorRouteChanged>,
  ) => {
    if (
      event.source === parentWindow &&
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
    parentWindow.postMessage(
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
    if (
      event.source === parentWindow &&
      event.data.type === ActivepiecesVendorEventName.VENDOR_INIT
    ) {
      if (event.data.data.jwtToken) {
        if (event.data.data.mode) {
          setTheme(event.data.data.mode);
        }
        mutateAsync(
          {
            externalAccessToken: event.data.data.jwtToken,
            locale: event.data.data.locale ?? 'en',
          },
          {
            onSuccess: (data) => {
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
                  hidePageHeader: event.data.data.hidePageHeader ?? false,
                });
              });
              memoryRouter.navigate(initialRoute);
              handleVendorNavigation({ projectId: data.projectId });
              handleClientNavigation();
              notifyVendorPostAuthentication();
            },
            onError: (error) => {
              const errorEvent: ActivepiecesClientAuthenticationFailed = {
                type: ActivepiecesClientEventName.CLIENT_AUTHENTICATION_FAILED,
                data: error,
              };
              parentWindow.postMessage(errorEvent, '*');
            },
          },
        );
      } else {
        console.error('Token sent via the sdk is empty');
      }
    }
  };

  useEffectOnce(() => {
    const event: ActivepiecesClientInit = {
      type: ActivepiecesClientEventName.CLIENT_INIT,
      data: {},
    };
    parentWindow.postMessage(event, '*');
    window.addEventListener('message', initState);
    return () => {
      window.removeEventListener('message', initState);
    };
  });
  return <LoadingScreen brightSpinner={embedState.useDarkBackground} />;
});

EmbedPage.displayName = 'EmbedPage';
export { EmbedPage };
