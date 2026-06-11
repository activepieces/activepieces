import { ApFlagId } from '@activepieces/shared';
import { useSuspenseQuery } from '@tanstack/react-query';

import { flagsApi, FlagsMap } from '../api/flags-api';

type WebsiteBrand = {
  websiteName: string;
  logos: {
    fullLogoUrl: string;
    favIconUrl: string;
    logoIconUrl: string;
  };
  colors: {
    avatar: string;
    'blue-link': string;
    danger: string;
    selection: string;
    primary: {
      default: string;
      dark: string;
      light: string;
      medium: string;
    };
    warn: {
      default: string;
      light: string;
      dark: string;
    };
    success: {
      default: string;
      light: string;
    };
  };
};
const queryKey = ['flags'];
export const flagsHooks = {
  queryKey,
  useFlags: () => {
    return useSuspenseQuery<FlagsMap, Error>({
      queryKey,
      queryFn: flagsApi.getAll,
      staleTime: Infinity,
    });
  },
  useWebsiteBranding: () => {
    const { data: theme } = flagsHooks.useFlag<WebsiteBrand>(ApFlagId.THEME);
    return theme!;
  },
  useFlag: <T>(flagId: ApFlagId) => {
    const data = useSuspenseQuery<FlagsMap, Error>({
      queryKey: ['flags'],
      queryFn: flagsApi.getAll,
      staleTime: Infinity,
    }).data?.[flagId] as T | null;
    return {
      data,
    };
  },
};
