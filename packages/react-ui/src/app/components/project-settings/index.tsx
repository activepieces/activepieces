import { DialogTitle } from '@radix-ui/react-dialog';
import { t } from 'i18next';
import { Bell, Settings, Users } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { cn } from '@/lib/utils';
import { Permission } from '@activepieces/shared';

import { AlertsSettings } from './alerts';
import { GeneralSettings } from './general';
import { TeamSettings } from './team';

type TabId = 'general' | 'team' | 'alerts';

interface ProjectSettingsDialogProps {
  open: boolean;
  onClose: () => void;
  projectId?: string;
  initialValues?: {
    projectName?: string;
    tasks?: string;
    aiCredits?: string;
    externalId?: string;
  };
}

type FormValues = {
  projectName: string;
  tasks: string;
  aiCredits: string;
  externalId?: string;
};

export function ProjectSettingsDialog({
  open,
  onClose,
  projectId,
  initialValues,
}: ProjectSettingsDialogProps) {
  const [activeTab, setActiveTab] = useState<TabId>('general');
  const { checkAccess } = useAuthorization();

  const form = useForm<FormValues>({
    defaultValues: {
      projectName: initialValues?.projectName,
      tasks: initialValues?.tasks || '',
      aiCredits: initialValues?.aiCredits || '',
      externalId: initialValues?.externalId,
    },
    disabled: checkAccess(Permission.WRITE_PROJECT) === false,
  });

  useEffect(() => {
    if (open) {
      form.reset(initialValues);
    }
  }, [open]);

  const tabs = [
    {
      id: 'general' as TabId,
      label: t('General'),
      icon: <Settings className="w-4 h-4" />,
      disabled: false,
    },
    {
      id: 'team' as TabId,
      label: t('Team'),
      icon: <Users className="w-4 h-4" />,
      disabled: !checkAccess(Permission.READ_PROJECT_MEMBER),
    },
    {
      id: 'alerts' as TabId,
      label: t('Alerts'),
      icon: <Bell className="w-4 h-4" />,
      disabled: !checkAccess(Permission.READ_ALERT),
    },
  ].filter((tab) => !tab.disabled);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <GeneralSettings
            form={form}
            projectId={projectId}
            initialValues={initialValues}
          />
        );
      case 'team':
        return <TeamSettings />;
      case 'alerts':
        return <AlertsSettings />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-full max-h-[90vh] h-fit pb-4 flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-semibold">
            {t('Project Settings')}
          </DialogTitle>
        </DialogHeader>

        <div className="flex h-[600px]">
          <div className="w-56 pr-4">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <Button
                  variant="ghost"
                  key={tab.id}
                  className={cn(
                    'w-full justify-start gap-2 text-left h-9 text-sm font-medium rounded-lg transition-all',
                    {
                      'bg-primary/10 text-primary hover:bg-primary/15':
                        activeTab === tab.id,
                      'hover:bg-muted/50': activeTab !== tab.id,
                    },
                  )}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.icon}
                  {tab.label}
                </Button>
              ))}
            </nav>
          </div>
          <div className="flex-1">
            <ScrollArea className="h-full">
              <div className="space-y-6 pr-4">{renderTabContent()}</div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
