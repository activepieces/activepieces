import { createContext, useState, useCallback, useMemo } from 'react';

export const DynamicPropertiesContext = createContext<{
  propertiesNamesStillLoading: string[];
  propertyLoadingFinished: (propertyName: string) => void;
  propertyLoadingStarted: (propertyName: string) => void;
  isLoadingDynamicProperties: boolean;
  authReconnectVersion: number;
  notifyAuthReconnected: () => void;
}>({
  propertiesNamesStillLoading: [],
  propertyLoadingFinished: (_propertyName: string) => {},
  propertyLoadingStarted: (_propertyName: string) => {},
  isLoadingDynamicProperties: false,
  authReconnectVersion: 0,
  notifyAuthReconnected: () => {},
});

export const DynamicPropertiesProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [propertiesNamesStillLoading, setPropertiesNamesStillLoading] =
    useState<string[]>([]);
  const [authReconnectVersion, setAuthReconnectVersion] = useState(0);

  const propertyLoadingFinished = useCallback((propertyName: string) => {
    setPropertiesNamesStillLoading((prev) =>
      prev.filter((name) => name !== propertyName),
    );
  }, []);

  const propertyLoadingStarted = useCallback((propertyName: string) => {
    setPropertiesNamesStillLoading((prev) => [...prev, propertyName]);
  }, []);

  const notifyAuthReconnected = useCallback(() => {
    setAuthReconnectVersion((prev) => prev + 1);
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
      authReconnectVersion,
      notifyAuthReconnected,
    }),
    [
      propertiesNamesStillLoading,
      propertyLoadingFinished,
      propertyLoadingStarted,
      isLoadingDynamicProperties,
      authReconnectVersion,
      notifyAuthReconnected,
    ],
  );

  return (
    <DynamicPropertiesContext.Provider value={contextValue}>
      {children}
    </DynamicPropertiesContext.Provider>
  );
};
