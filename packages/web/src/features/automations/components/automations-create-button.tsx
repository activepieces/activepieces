import { t } from 'i18next';
import { ChevronDown, Plus } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { PermissionNeededTooltip } from '@/components/custom/permission-needed-tooltip';
import { useEmbedding } from '@/components/providers/embed-provider';
import { Button } from '@/components/ui/button';
import {
  ButtonGroup,
  ButtonGroupSeparator,
} from '@/components/ui/button-group';
import { TemplatesBrowseDialog } from '@/features/templates';

import { CreateNewMenu } from './create-new-menu';

export const AutomationsCreateButton = ({
  userHasPermissionToWriteFlow,
  userHasPermissionToWriteTable,
  userHasPermissionToWriteFolder,
  isCreatingFlow,
  isCreatingTable,
  onCreateFlow,
  onCreateTable,
  onCreateFolder,
  onImportFlow,
  onImportTable,
}: AutomationsCreateButtonProps) => {
  const navigate = useNavigate();
  const { embedState } = useEmbedding();
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);

  return (
    <>
      <ButtonGroup>
        <PermissionNeededTooltip hasPermission={userHasPermissionToWriteFlow}>
          <Button
            className="rounded-r-none"
            disabled={!userHasPermissionToWriteFlow || isCreatingTable}
            loading={isCreatingFlow}
            onClick={onCreateFlow}
          >
            <Plus />
            {t('New flow')}
          </Button>
        </PermissionNeededTooltip>
        <ButtonGroupSeparator className="bg-accent-8" />
        <CreateNewMenu
          scope="root"
          align="end"
          showCreateFlow={false}
          userHasPermissionToWriteFlow={userHasPermissionToWriteFlow}
          userHasPermissionToWriteTable={userHasPermissionToWriteTable}
          userHasPermissionToWriteFolder={userHasPermissionToWriteFolder}
          isCreatingFlow={isCreatingFlow}
          isCreatingTable={isCreatingTable}
          onCreateFlow={onCreateFlow}
          onCreateTable={onCreateTable}
          onCreateFolder={onCreateFolder}
          onImportFlow={onImportFlow}
          onImportTable={onImportTable}
          onSelectTemplate={() => {
            if (embedState.isEmbedded) {
              setIsTemplatesOpen(true);
            } else {
              navigate('/templates');
            }
          }}
        >
          <Button
            size="icon"
            className="rounded-l-none"
            aria-label={t('More ways to create')}
          >
            <ChevronDown />
          </Button>
        </CreateNewMenu>
      </ButtonGroup>
      <TemplatesBrowseDialog
        open={isTemplatesOpen}
        onOpenChange={setIsTemplatesOpen}
      />
    </>
  );
};

type AutomationsCreateButtonProps = {
  userHasPermissionToWriteFlow: boolean;
  userHasPermissionToWriteTable: boolean;
  userHasPermissionToWriteFolder: boolean;
  isCreatingFlow: boolean;
  isCreatingTable: boolean;
  onCreateFlow: () => void;
  onCreateTable: () => void;
  onCreateFolder: () => void;
  onImportFlow: () => void;
  onImportTable: () => void;
};
