import { QuestionMarkCircledIcon } from '@radix-ui/react-icons';
import { useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { CheckCircleIcon, Trash } from 'lucide-react';

import { AddCustomDomainDialog } from '@/app/routes/platform/setup/branding/add-custom-domain';
import { ConfirmationDeleteDialog } from '@/components/delete-dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { LoadingSpinner } from '@/components/ui/spinner';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { customDomainApi } from '@/features/platform-admin-panel/lib/custom-domain-api';
import { CustomDomain, CustomDomainStatus } from '@activepieces/ee-shared';

const CustomDomainsCard = () => {
  const { data, isLoading, isError, isSuccess, refetch } = useQuery({
    queryKey: ['custom-domain-list'],
    queryFn: async () => {
      const response = await customDomainApi.list();
      return response.data;
    },
  });

  return (
    <>
      <Separator className="my-2" />
      <div className="text-lg font-bold">{t('Custom Domains')}</div>
      <div className="grid gap-4">
        <div className="min-h-[35px]">
          {isLoading && (
            <div className="flex items-center justify-center">
              <LoadingSpinner />
            </div>
          )}
          {isError && <div>{t('Error, please try again.')}</div>}
          {isSuccess && data.length === 0 && (
            <div className="text-center">{t('No domains added yet.')}</div>
          )}
          {Array.isArray(data) &&
            data.map((domain: CustomDomain) => (
              <div
                className="flex items-center justify-between space-x-4"
                key={domain.id}
              >
                <div className="flex gap-2 items-center justify-center">
                  <p className="text-sm font-medium leading-none fibt">
                    {domain.domain}
                  </p>
                  {domain.status === CustomDomainStatus.ACTIVE && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <CheckCircleIcon className="h-5 w-5 text-success" />
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        {t('Verified')}
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {domain.status === CustomDomainStatus.PENDING && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <QuestionMarkCircledIcon className="h-5 w-5 text-success" />
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        {t(
                          'Pending, please contact the support for dns verification.',
                        )}
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
                <ConfirmationDeleteDialog
                  title={`${t('Delete')} ${domain.domain}`}
                  message={t('Are you sure you want to delete {domain}?', {
                    domain: domain.domain,
                  })}
                  mutationFn={async () => {
                    await customDomainApi.delete(domain.id);
                    refetch();
                  }}
                  entityName={t('flow')}
                >
                  <Button
                    variant="ghost"
                    className="size-8 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <Trash className="size-4 text-destructive" />
                  </Button>
                </ConfirmationDeleteDialog>
              </div>
            ))}
        </div>
        <AddCustomDomainDialog onAdd={() => refetch()} />
      </div>
    </>
  );
};

CustomDomainsCard.displayName = 'CustomDomainsCard';
export { CustomDomainsCard };
