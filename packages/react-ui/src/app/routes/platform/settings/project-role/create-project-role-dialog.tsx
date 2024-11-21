import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { useState, ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { projectRoleApi } from '@/features/platform-admin-panel/lib/project-role-api';
import { RoleType } from '@activepieces/shared';

interface CreateProjectRoleDialogProps {
  onCreate: () => void;
  children: ReactNode;
  platformId: string;
}

export const CreateProjectRoleDialog = ({
  onCreate,
  platformId,
  children,
}: CreateProjectRoleDialogProps) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [roleName, setRoleName] = useState('');

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      await projectRoleApi.create({
        name: roleName,
        permissions: [],
        platformId,
        type: RoleType.CUSTOM,
      });
    },
    onSuccess: () => {
      onCreate();
      setIsOpen(false);
      toast({
        title: t('Success'),
        description: t('Project Role entry created successfully'),
        duration: 3000,
      });
      setRoleName('');
    },
    onError: () => {
      toast({
        title: t('Error'),
        description: t('Failed to create Project Role entry'),
        duration: 3000,
      });
    },
  });

  const handleCreate = () => {
    mutate();
  };

  return (
    <>
      <div onClick={() => setIsOpen(true)}>{children}</div>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('Create New Role')}</DialogTitle>
          </DialogHeader>
          <div className="grid space-y-4 text-center">
            <Input
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              required
              id="name"
              type="text"
              placeholder={t('Role Name')}
              className="rounded-sm"
            />
          </div>
          <DialogFooter className="justify-center">
            <Button loading={isPending} onClick={handleCreate}>
              {t('Create')}
            </Button>
            <Button variant={'outline'} onClick={() => setIsOpen(false)}>
              {t('Close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
