import { UpdatePlatformConfigurationRequestBody } from '@activepieces/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { Activity } from 'lucide-react';
import { toast } from 'sonner';

import { platformConfigurationApi } from '@/api/platform-configuration-api';
import {
  Item,
  ItemMedia,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemActions,
} from '@/components/custom/item';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { platformConfigurationHooks } from '@/hooks/platform-configuration-hooks';

export const TelemetrySection = () => {
  const queryClient = useQueryClient();

  const { data: configuration, isLoading } = useQuery({
    queryKey: platformConfigurationHooks.queryKey,
    queryFn: platformConfigurationApi.get,
    refetchOnMount: 'always',
    meta: { showErrorDialog: true, loadSubsetOptions: {} },
  });

  const { mutate: updateConfiguration, isPending } = useMutation({
    mutationFn: (request: UpdatePlatformConfigurationRequestBody) =>
      platformConfigurationApi.update(request),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: platformConfigurationHooks.queryKey,
      });
      toast.success(t('Your changes have been saved.'), { duration: 3000 });
    },
    onError: () => {
      toast.error(t('Failed to save changes. Please try again.'));
    },
  });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold">{t('Telemetry')}</h2>
        <p className="text-sm text-muted-foreground">
          {t(
            'Help us improve Activepieces. We never receive what your flows do, the data they process, or anything inside your connections and API keys.',
          )}
        </p>
      </div>
      <Item variant="outline">
        <ItemMedia variant="icon">
          <Activity />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>{t('Product analytics')}</ItemTitle>
          <ItemDescription className="line-clamp-none">
            {t(
              'Shares usage events so we can see which features are used and fix what breaks.',
            )}
          </ItemDescription>
        </ItemContent>
        <ItemActions>
          {isLoading ? (
            <Skeleton className="h-5 w-9" />
          ) : (
            <Switch
              checked={configuration?.isProductTelemetryEnabled ?? false}
              onCheckedChange={(checked) =>
                updateConfiguration({ isProductTelemetryEnabled: checked })
              }
              disabled={isPending}
            />
          )}
        </ItemActions>
      </Item>
    </div>
  );
};
