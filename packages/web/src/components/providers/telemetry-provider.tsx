import { ApFlagId, isNil, TelemetryEvent } from '@activepieces/shared';
import posthog from 'posthog-js';
import React, { useEffect, useRef } from 'react';
import { useDeepCompareEffect } from 'react-use';

import { flagsHooks } from '@/hooks/flags-hooks';
import { userHooks } from '@/hooks/user-hooks';
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

  const posthogInitialized = useRef(false);

  useEffect(() => {
    if (posthogInitialized.current) {
      return;
    }
    // Skip init entirely (not just capture) when telemetry is off, or for embedded
    // sessions — the /embed route or any iframe, since an embed can navigate to
    // non-/embed routes. Those are customers' end-users, not our funnel.
    const isEmbedded =
      window.location.pathname.startsWith('/embed') ||
      window.self !== window.top;
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

    // Tag events so the shared project separates product from marketing traffic.
    posthog.register({ source_site: 'product' });
  }, [telemetryEnabled]);

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

    posthog.identify(currentUser.id, {
      email: currentUser.email,
      firstName: currentUser.firstName,
      lastName: currentUser.lastName,
      activepiecesVersion: currentVersion,
      activepiecesEnvironment: environment,
    });

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
