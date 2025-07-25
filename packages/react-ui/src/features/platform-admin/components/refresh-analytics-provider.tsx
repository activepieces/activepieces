import { createContext, useState } from 'react';

export const RefreshAnalyticsContext = createContext({
  isRefreshing: false,
  setIsRefreshing: (isRefreshing: boolean) => {},
});

export const RefreshAnalyticsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  return (
    <RefreshAnalyticsContext.Provider value={{ isRefreshing, setIsRefreshing }}>
      {children}
    </RefreshAnalyticsContext.Provider>
  );
};
