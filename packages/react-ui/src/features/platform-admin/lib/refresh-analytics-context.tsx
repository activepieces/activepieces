// Stub for removed platform-admin feature
import React, { createContext, useContext, ReactNode } from 'react';

interface RefreshAnalyticsContextType {
  refreshAnalytics: () => void;
}

const RefreshAnalyticsContextDefault: RefreshAnalyticsContextType = {
  refreshAnalytics: () => {},
};

export const RefreshAnalyticsContext = createContext<RefreshAnalyticsContextType>(RefreshAnalyticsContextDefault);

export const RefreshAnalyticsProvider = ({ children }: { children: ReactNode }) => {
  return (
    <RefreshAnalyticsContext.Provider value={{ refreshAnalytics: () => {} }}>
      {children}
    </RefreshAnalyticsContext.Provider>
  );
};

export const useRefreshAnalytics = () => useContext(RefreshAnalyticsContext);
