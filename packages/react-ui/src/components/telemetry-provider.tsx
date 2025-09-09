import { AnalyticsBrowser } from '@segment/analytics-next';
import posthog from 'posthog-js';
import React, { useEffect, useState, useRef } from 'react';
import { useDeepCompareEffect } from 'react-use';

import { flagsHooks } from '@/hooks/flags-hooks';
import { userHooks } from '@/hooks/user-hooks';
import {
  ApFlagId,
  isNil,
  TelemetryEvent,
  UserWithMetaInformationAndProject,
} from '@activepieces/shared';

interface TelemetryProviderProps {
  children: React.ReactNode;
}

const TelemetryProvider = ({ children }: TelemetryProviderProps) => {
  const { data: currentUser } = userHooks.useCurrentUser();
  const [analytics, setAnalytics] = useState<AnalyticsBrowser | null>(null);
  const initializedUserEmail = useRef<string | null>(null);

  const [user, setUser] = useState<UserWithMetaInformationAndProject | null>(
    currentUser ?? null,
  );
  const { data: telemetryEnabled } = flagsHooks.useFlag<boolean>(
    ApFlagId.TELEMETRY_ENABLED,
  );
  const { data: flagCurrentVersion } = flagsHooks.useFlag<string>(
    ApFlagId.CURRENT_VERSION,
  );
  const { data: flagEnvironment } = flagsHooks.useFlag<string>(
    ApFlagId.ENVIRONMENT,
  );

  useEffect(() => {
    const handleStorageChange = (_event: StorageEvent) => {
      setUser(currentUser ?? null);
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  useDeepCompareEffect(() => {
    if (isNil(user)) {
      return;
    }

    if (telemetryEnabled && user?.email !== initializedUserEmail.current) {
      initTelemetry();
    }
  }, [telemetryEnabled, user]);

  const initTelemetry = () => {
    if (isNil(user)) {
      return;
    }
    console.log('Telemetry enabled');
    const newAnalytics = AnalyticsBrowser.load({
      writeKey: 'LzmO14emO8lqm0ANNGi9rwBpaazHvFbo',
    });

    newAnalytics.addSourceMiddleware(({ payload, next }) => {
      const path = payload?.obj?.properties?.['path'];
      const ignoredPaths = ['/embed'];
      if (ignoredPaths.includes(path)) {
        return;
      }
      next(payload);
    });

    const currentVersion = flagCurrentVersion || '0.0.0';
    const environment = flagEnvironment || '0.0.0';

    newAnalytics.identify(user.id, {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      activepiecesVersion: currentVersion,
      activepiecesEnvironment: environment,
      ui: 'react',
    });

    newAnalytics.ready(() => {
      posthog.init('phc_7F92HoXJPeGnTKmYv0eOw62FurPMRW9Aqr0TPrDzvHh', {
        autocapture: false,
        capture_pageview: false,
        segment: (window as any).analytics,
        loaded: () => newAnalytics.page(),
      });

      posthog.identify(user.id, {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        activepiecesVersion: currentVersion,
        activepiecesEnvironment: environment,
      });
    });
    setAnalytics(newAnalytics);
    initializedUserEmail.current = user.email;
  };

  const reset = () => {
    if (analytics) {
      analytics.reset();
    }
    posthog.reset();
    console.log('Telemetry removed');
    initializedUserEmail.current = null;
  };

  const capture = (event: TelemetryEvent) => {
    if (telemetryEnabled && analytics) {
      analytics.track(event.name, event.payload);
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
