import { isNil } from '@activepieces/core-utils';
import {
  ApEdition,
  ApFlagId,
  pickTelemetryPii,
  TelemetryEvent,
} from '@activepieces/shared';
import posthog from 'posthog-js';
import React, { useEffect, useRef } from 'react';
import { useDeepCompareEffect } from 'react-use';

import { useEmbedding } from '@/components/providers/embed-provider';
import { flagsHooks } from '@/hooks/flags-hooks';
import { userHooks } from '@/hooks/user-hooks';
import { acquisitionUtils } from '@/lib/acquisition-utils';
import { errorReporting } from '@/lib/error-reporting';

interface TelemetryProviderProps {
  children: React.ReactNode;
}

const TelemetryProvider = ({ children }: TelemetryProviderProps) => {
  const { data: currentUser } = userHooks.useCurrentUser();
  const initializedUserEmail = useRef<string | null>(null);

  const { data: telemetryEnabled } = flagsHooks.useFlag<boolean>(
    ApFlagId.TELEMETRY_ENABLED,
  );
  const { data: flagCurrentVersion } = flagsHooks.useFlag<string>(
    ApFlagId.CURRENT_VERSION,
  );
  const { data: flagEnvironment } = flagsHooks.useFlag<string>(
    ApFlagId.ENVIRONMENT,
  );
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const { embedState } = useEmbedding();

  const posthogInitialized = useRef(false);

  useEffect(() => {
    if (posthogInitialized.current) {
      return;
    }
    // Skip init entirely (not just capture) when telemetry is off, or for the
    // embed route — those are customers' end-users, not our funnel. Gate on the
    // /embed route only (matching embedState.isEmbedded, which is set on that
    // route), NOT on `window.self !== window.top`, so legitimately iframed
    // product sessions still get tagged.
    const isEmbedded =
      embedState.isEmbedded || window.location.pathname.startsWith('/embed');
    if (!telemetryEnabled || isEmbedded) {
      return;
    }
    posthogInitialized.current = true;

    posthog.init('phc_7F92HoXJPeGnTKmYv0eOw62FurPMRW9Aqr0TPrDzvHh', {
      // Same-origin reverse proxy (/ingest) so ad blockers don't drop ingestion.
      api_host: '/ingest',
      ui_host: 'https://us.posthog.com',
      // Adopt the identity cookie the marketing site sets on `.activepieces.com`.
      cross_subdomain_cookie: true,
      // Limit autocapture to the auth funnel; the rest of the app doesn't need it.
      autocapture: {
        url_allowlist: [
          /\/sign-up/,
          /\/sign-in/,
          /\/verify-email/,
          /\/forget-password/,
          /\/reset-password/,
          /\/invitation/,
          /\/authenticate/,
        ],
      },
      capture_pageview: 'history_change',
      capture_pageleave: true,
      capture_dead_clicks: true,
      rageclick: true,
      enable_heatmaps: true,
      person_profiles: 'identified_only',
      persistence: 'localStorage+cookie',
      disable_session_recording: false,
      enable_recording_console_log: false,
    });

    // Register synchronously after init so even the first events are tagged:
    // source_site separates product from marketing traffic, and
    // activepiecesEdition (matching the backend telemetry property) makes
    // cloud vs self-hosted cleanly filterable in the shared project.
    posthog.register({
      source_site: 'product',
      activepiecesEdition: edition ?? ApEdition.COMMUNITY,
    });
  }, [telemetryEnabled, edition, embedState.isEmbedded]);

  useEffect(() => {
    errorReporting.init();
    errorReporting.flushBuffered();
  }, []);

  useDeepCompareEffect(() => {
    if (isNil(currentUser)) {
      return;
    }

    if (
      telemetryEnabled &&
      currentUser?.email !== initializedUserEmail.current
    ) {
      initTelemetry();
    }
  }, [telemetryEnabled, currentUser]);

  const initTelemetry = () => {
    if (isNil(currentUser)) {
      return;
    }
    const currentVersion = flagCurrentVersion || '0.0.0';
    const environment = flagEnvironment || '0.0.0';

    // PII (email/name) is gated to Cloud — see pickTelemetryPii.
    posthog.identify(
      currentUser.id,
      {
        ...pickTelemetryPii({
          edition: edition ?? ApEdition.COMMUNITY,
          email: currentUser.email,
          firstName: currentUser.firstName,
          lastName: currentUser.lastName,
        }),
        activepiecesVersion: currentVersion,
        activepiecesEnvironment: environment,
      },
      // First-touch acquisition source (UTM only, no PII) persisted on the
      // person so it attaches to backend signed.up via person-on-events.
      acquisitionUtils.getAcquisitionParams(),
    );

    if (currentUser.platformId) {
      posthog.group('platform', currentUser.platformId);
    }

    initializedUserEmail.current = currentUser.email;
  };

  const reset = () => {
    posthog.reset();
    initializedUserEmail.current = null;
  };

  const capture = (event: TelemetryEvent) => {
    if (telemetryEnabled) {
      posthog.capture(event.name, event.payload);
    }
  };

  return (
    <TelemetryContext.Provider value={{ capture, reset }}>
      {children}
    </TelemetryContext.Provider>
  );
};

interface TelemetryContextType {
  capture: (event: TelemetryEvent) => void;
  reset: () => void;
}

const TelemetryContext = React.createContext<TelemetryContextType>({
  capture: () => {},
  reset: () => {},
});

export const useTelemetry = () => React.useContext(TelemetryContext);

export default TelemetryProvider;
