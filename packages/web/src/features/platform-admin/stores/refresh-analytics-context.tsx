import { createContext, useState, useCallback } from 'react';

type TimeSavedOverride = {
  value: number | null;
  updatedAt: number;
};

type RefreshAnalyticsContextType = {
  isRefreshing: boolean;
  setIsRefreshing: (isRefreshing: boolean) => void;
  timeSavedPerRunOverrides: Record<string, TimeSavedOverride>;
  setTimeSavedPerRunOverride: (flowId: string, value: number | null) => void;
  clearTimeSavedPerRunOverrides: (params: { setBefore: number }) => void;
};

export const RefreshAnalyticsContext =
  createContext<RefreshAnalyticsContextType>({
    isRefreshing: false,
    setIsRefreshing: () => {},
    timeSavedPerRunOverrides: {},
    setTimeSavedPerRunOverride: () => {},
    clearTimeSavedPerRunOverrides: () => {},
  });

export const RefreshAnalyticsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timeSavedPerRunOverrides, setTimeSavedPerRunOverrides] = useState<
    Record<string, TimeSavedOverride>
  >({});

  const setTimeSavedPerRunOverride = useCallback(
    (flowId: string, value: number | null) => {
      setTimeSavedPerRunOverrides((prev) => ({
        ...prev,
        [flowId]: { value, updatedAt: Date.now() },
      }));
    },
    [],
  );

  const clearTimeSavedPerRunOverrides = useCallback(
    ({ setBefore }: { setBefore: number }) => {
      setTimeSavedPerRunOverrides((prev) =>
        Object.fromEntries(
          Object.entries(prev).filter(
            ([, override]) => override.updatedAt >= setBefore,
          ),
        ),
      );
    },
    [],
  );

  return (
    <RefreshAnalyticsContext.Provider
      value={{
        isRefreshing,
        setIsRefreshing,
        timeSavedPerRunOverrides,
        setTimeSavedPerRunOverride,
        clearTimeSavedPerRunOverrides,
      }}
    >
      {children}
    </RefreshAnalyticsContext.Provider>
  );
};
