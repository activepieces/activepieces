import { createContext, useState, useCallback, useMemo } from 'react';

export const DynamicPropertiesContext = createContext<{
  propertiesNamesStillLoading: string[];
  propertyLoadingFinished: (propertyName: string) => void;
  propertyLoadingStarted: (propertyName: string) => void;
  isLoadingDynamicProperties: boolean;
}>({
  propertiesNamesStillLoading: [],
  propertyLoadingFinished: (propertyName: string) => {},
  propertyLoadingStarted: (propertyName: string) => {},
  isLoadingDynamicProperties: false,
});

export const DynamicPropertiesProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [propertiesNamesStillLoading, setPropertiesNamesStillLoading] =
    useState<string[]>([]);

  const propertyLoadingFinished = useCallback((propertyName: string) => {
    setPropertiesNamesStillLoading((prev) =>
      prev.filter((name) => name !== propertyName),
    );
  }, []);

  const propertyLoadingStarted = useCallback((propertyName: string) => {
    setPropertiesNamesStillLoading((prev) => [...prev, propertyName]);
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
    }),
    [
      propertiesNamesStillLoading,
      propertyLoadingFinished,
      propertyLoadingStarted,
      isLoadingDynamicProperties,
    ],
  );

  return (
    <DynamicPropertiesContext.Provider value={contextValue}>
      {children}
    </DynamicPropertiesContext.Provider>
  );
};
