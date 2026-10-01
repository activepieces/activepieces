import { PlatformWithoutSensitiveData } from '@activepieces/shared';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { platformApi } from '@/api/platforms-api';
import { Panel } from '@/components/custom/panel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { internalErrorToast } from '@/components/ui/sonner';

export const AllowedDomainsPanel = ({
  platform,
  refetch,
}: AllowedDomainsPanelProps) => {
  const [draft, setDraft] = useState('');
  const domains = platform.allowedAuthDomains ?? [];
  const candidate = draft.trim().toLowerCase();
  const canAdd = candidate.includes('.') && !domains.includes(candidate);

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

  const add = () => {
    if (!canAdd || isPending) return;
    setDraft('');
    saveDomains([...domains, candidate], {
      onError: () => setDraft(candidate),
    });
  };

  return (
    <Panel
      title={t('Allowed email domains')}
      description={t(
        'Only addresses on these domains can sign up or be invited. Empty means anyone.',
      )}
    >
      <div className="flex flex-wrap gap-2">
        {domains.length === 0 && (
          <span className="text-sm text-gray-11">
            {t('No domains set. Anyone can sign up.')}
          </span>
        )}
        {domains.map((domain) => (
          <Badge key={domain} variant="outline">
            {domain}
            <button
              type="button"
              aria-label={t('Remove {name}', { name: domain })}
              disabled={isPending}
              onClick={() =>
                saveDomains(domains.filter((item) => item !== domain))
              }
              className="text-gray-11 outline-hidden hover:text-gray-12 focus-visible:text-gray-12 disabled:opacity-50"
            >
              <X />
            </button>
          </Badge>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <Input
          value={draft}
          placeholder="example.com"
          aria-label={t('Domain')}
          className="w-56"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              add();
            }
          }}
        />
        <Button
          variant="outline"
          disabled={!canAdd}
          loading={isPending && canAdd}
          onClick={add}
        >
          {t('Add')}
        </Button>
      </div>
    </Panel>
  );
};

type AllowedDomainsPanelProps = {
  platform: PlatformWithoutSensitiveData;
  refetch: () => Promise<void>;
};
