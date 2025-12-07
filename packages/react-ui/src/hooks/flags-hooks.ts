import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query';

import { fileUtils } from '@/lib/file-utils';
import { ApFlagId, File } from '@activepieces/shared';

import { flagsApi, FlagsMap } from '../lib/flags-api';

import { fileHooks } from './file-hooks';

type WebsiteBrand = {
  websiteName: string;
  logos: {
    fullLogoUrl: string;
    favIconUrl: string;
    logoIconUrl: string;
  };
  colors: {
    primary: {
      default: string;
      dark: string;
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
    const queryClient = useQueryClient();

    const changeLogo = (
      file: File,
      key: 'fullLogoUrl' | 'logoIconUrl' | 'favIconUrl',
    ) => {
      queryClient.setQueryData(['flags'], (previousFlags: FlagsMap) => {
        const previousTheme = previousFlags[ApFlagId.THEME] as WebsiteBrand;
        const updatedLogos = {
          ...previousTheme?.logos,
          [key]: fileUtils.fileToBase64(file),
        };
        const updatedTheme = {
          ...previousTheme,
          logos: updatedLogos,
        };
        return {
          ...previousFlags,
          [ApFlagId.THEME]: updatedTheme,
        };
      });
    };

    fileHooks.useOnLoadDbFile(theme?.logos.fullLogoUrl, (file) =>
      changeLogo(file, 'fullLogoUrl'),
    );
    fileHooks.useOnLoadDbFile(theme?.logos.logoIconUrl, (file) =>
      changeLogo(file, 'logoIconUrl'),
    );
    fileHooks.useOnLoadDbFile(theme?.logos.favIconUrl, (file) =>
      changeLogo(file, 'favIconUrl'),
    );

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
