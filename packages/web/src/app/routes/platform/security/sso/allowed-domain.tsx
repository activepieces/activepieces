import { PlatformWithoutSensitiveData } from '@activepieces/shared';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { toast } from 'sonner';

import { platformApi } from '@/api/platforms-api';
import { Panel } from '@/components/custom/panel';
import { ChipListField } from '@/components/custom/settings-parts';
import { internalErrorToast } from '@/components/ui/sonner';

export const AllowedDomainsPanel = ({
  platform,
  refetch,
}: AllowedDomainsPanelProps) => {
  const domains = platform.allowedAuthDomains ?? [];

  const { mutate: saveDomains, isPending } = useMutation({
    mutationFn: async (next: string[]) => {
      await platformApi.update(
        {
          allowedAuthDomains: next,
          enforceAllowedAuthDomains: next.length > 0,
        },
        platform.id,
      );
      await refetch();
    },
    onSuccess: () => {
      toast.success(t('Allowed domains updated'), { duration: 3000 });
    },
    onError: () => internalErrorToast(),
  });

  return (
    <Panel
      title={t('Allowed email domains')}
      description={t(
        'Only addresses on these domains can sign up or be invited. Empty means anyone.',
      )}
    >
      <ChipListField
        values={domains}
        placeholder="example.com"
        emptyLabel={t('No domains set. Anyone can sign up.')}
        disabled={isPending}
        validate={(value) =>
          value.includes('.') ? null : t('Enter a domain such as example.com')
        }
        onAdd={(value) => saveDomains([...domains, value.toLowerCase()])}
        onRemove={(value) =>
          saveDomains(domains.filter((item) => item !== value))
        }
      />
    </Panel>
  );
};

type AllowedDomainsPanelProps = {
  platform: PlatformWithoutSensitiveData;
  refetch: () => Promise<void>;
};
