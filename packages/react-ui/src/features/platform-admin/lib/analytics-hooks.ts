// Stub for removed platform-admin feature
export const platformAnalyticsHooks = {
  useRefreshAnalytics: () => ({
    mutate: () => {},
    isPending: false,
  }),
  useGetAnalytics: () => ({
    data: null,
    isLoading: false,
  }),
};
