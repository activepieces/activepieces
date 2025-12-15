import { Button } from '@/components/ui/button';
import { UpsertAIProviderDialog } from './upsert-provider-dialog';
import { t } from 'i18next';
import { Plus } from 'lucide-react';

export const CreateNewProviderButton = ({ onSave }: { onSave: () => void }) => {
  return (
    <UpsertAIProviderDialog onSave={onSave}>
      <Button>
        <Plus className="size-4 mr-2" />
        {t('Add Provider')}
      </Button>
    </UpsertAIProviderDialog>
  );
};
