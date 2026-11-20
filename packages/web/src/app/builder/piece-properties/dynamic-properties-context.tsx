import { createContext, useState, useCallback, useMemo } from 'react';

export const DynamicPropertiesContext = createContext<{
  propertiesNamesStillLoading: string[];
  propertyLoadingFinished: (propertyName: string) => void;
  propertyLoadingStarted: (propertyName: string) => void;
  isLoadingDynamicProperties: boolean;
  authReconnectCount: number;
}>({
  propertiesNamesStillLoading: [],
  propertyLoadingFinished: (_propertyName: string) => {},
  propertyLoadingStarted: (_propertyName: string) => {},
  isLoadingDynamicProperties: false,
  authReconnectCount: 0,
});

export const DynamicPropertiesProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [propertiesNamesStillLoading, setPropertiesNamesStillLoading] =
    useState<string[]>([]);
  const [authReconnectCount, setAuthReconnectCount] = useState(0);

  const propertyLoadingFinished = useCallback((propertyName: string) => {
    setPropertiesNamesStillLoading((prev) =>
      prev.filter((name) => name !== propertyName),
    );
  }, []);

  const propertyLoadingStarted = useCallback((propertyName: string) => {
    setPropertiesNamesStillLoading((prev) => [...prev, propertyName]);
  }, []);

  const authReconnected = useCallback(() => {
    setAuthReconnectCount((count) => count + 1);
  }, []);

  const isLoadingDynamicProperties = useMemo(
    () => propertiesNamesStillLoading.length > 0,
    [propertiesNamesStillLoading],
  );

  const contextValue = useMemo(
    () => ({
      propertiesNamesStillLoading,
      propertyLoadingFinished,
      propertyLoadingStarted,
      isLoadingDynamicProperties,
      authReconnectCount,
    }),
    [
      propertiesNamesStillLoading,
      propertyLoadingFinished,
      propertyLoadingStarted,
      isLoadingDynamicProperties,
      authReconnectCount,
    ],
  );

  return (
    <DynamicPropertiesContext.Provider value={contextValue}>
      <AuthReconnectedContext.Provider value={authReconnected}>
        {children}
      </AuthReconnectedContext.Provider>
    </DynamicPropertiesContext.Provider>
  );
};

export const AuthReconnectedContext = createContext<() => void>(() => {});
