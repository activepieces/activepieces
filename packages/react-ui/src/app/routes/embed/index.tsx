import { useMutation } from '@tanstack/react-query';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useEffectOnce } from 'react-use';

import { useEmbedding } from '@/components/embed-provider';
import { authenticationSession } from '@/lib/authentication-session';
import { managedAuthApi } from '@/lib/managed-auth-api';
import {
  _AP_JWT_TOKEN_QUERY_PARAM_NAME,
  ActivepiecesClientEventName,
  ActivepiecesClientInit,
  ActivepiecesVendorEventName,
  ActivepiecesVendorInit,
} from 'ee-embed-sdk';

const EmbedPage = React.memo(() => {
  const navigate = useNavigate();
  const { setEmbedState } = useEmbedding();
  const { mutateAsync } = useMutation({
    mutationFn: managedAuthApi.generateApToken,
    onError: (error) => {
      console.error(error);
    },
  });

  const initState = (event: MessageEvent<ActivepiecesVendorInit>) => {
    if (
      event.source === window.parent &&
      event.data.type === ActivepiecesVendorEventName.VENDOR_INIT
    ) {
      setEmbedState({
        hideSideNav: event.data.data.hideSidebar,
        isEmbedded: true,
        hideLogoInBuilder: event.data.data.hideLogoInBuilder || false,
        hideFlowNameInBuilder: event.data.data.hideFlowNameInBuilder || false,
        prefix: event.data.data.prefix,
        disableNavigationInBuilder: event.data.data.disableNavigationInBuilder,
        hideFolders: event.data.data.hideFolders || false,
        sdkVersion: event.data.data.sdkVersion,
      });
      navigate('/');
    }
  };

  useEffectOnce(() => {
    const externalToken = new URLSearchParams(window.location.search).get(
      _AP_JWT_TOKEN_QUERY_PARAM_NAME,
    );
    if (!externalToken) {
      return;
    }
    mutateAsync(
      {
        externalAccessToken: externalToken,
      },
      {
        onSuccess: (data) => {
          authenticationSession.saveResponse(data);
          const event: ActivepiecesClientInit = {
            type: ActivepiecesClientEventName.CLIENT_INIT,
            data: {},
          };
          window.parent.postMessage(event, '*');
          window.addEventListener('message', initState);
        },
      },
    );

    return () => {
      window.removeEventListener('message', initState);
    };
  });

  return <div></div>;
});

EmbedPage.displayName = 'EmbedPage';
export { EmbedPage };
