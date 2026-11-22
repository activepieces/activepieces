import { UpgradeLocationInWebApp } from '@activepieces/shared';
import { t } from 'i18next';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover';
import { LockedGem, SelfServeTrialLockedActions } from '@/features/billing';
import { AdminControl, adminControl } from '@/lib/admin-control';

export const AddDomainButton = ({
  locked,
  lockedOpen,
  onLockedOpenChange,
  onAdd,
}: AddDomainButtonProps) => {
  if (!locked) {
    return (
      <Button
        {...adminControl(AdminControl.SSO_DOMAIN_ADD_OPEN)}
        data-testid="sso-domain-add"
        variant="outline"
        size="sm"
        onClick={onAdd}
      >
        <Plus className="size-4" />
        {t('Add domain')}
      </Button>
    );
  }
  return (
    <Popover open={lockedOpen} onOpenChange={onLockedOpenChange}>
      <PopoverTrigger asChild>
        <Button
          {...adminControl(AdminControl.SSO_DOMAIN_ADD_OPEN)}
          data-testid="sso-domain-add"
          variant="outline"
          size="sm"
        >
          <LockedGem className="text-accent-11" />
          {t('Add domain')}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="flex w-80 flex-col gap-4"
        data-testid="sso-domain-upsell"
      >
        <MultipleDomainsUpsell onAction={() => onLockedOpenChange(false)} />
      </PopoverContent>
    </Popover>
  );
};

export const MultipleDomainsUpsell = ({
  onAction,
}: {
  onAction: () => void;
}) => (
  <>
    <PopoverHeader>
      <PopoverTitle>{t('Unlock multiple domains')}</PopoverTitle>
      <PopoverDescription>
        {t(
          'Verify every domain you own to use SSO and set sign-in methods for everyone.',
        )}
      </PopoverDescription>
    </PopoverHeader>
    <SelfServeTrialLockedActions
      featureKey="MULTIPLE_EMAIL_DOMAINS"
      locationInWebApp={UpgradeLocationInWebApp.TEASER}
      onAction={onAction}
    />
  </>
);

type AddDomainButtonProps = {
  locked: boolean;
  lockedOpen: boolean;
  onLockedOpenChange: (open: boolean) => void;
  onAdd: () => void;
};
