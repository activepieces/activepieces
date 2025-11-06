import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';

import { tablesApi } from '../lib/tables-api';

type RenameTableDialogProps = {
  tableName: string;
  tableId: string;
  onRename: () => void;
  children: React.ReactNode;
};
const RenameTableDialog = ({
  tableName,
  tableId,
  onRename,
  children,
}: RenameTableDialogProps) => {
  const form = useForm<{ name: string }>({
    defaultValues: {
      name: tableName,
    },
    resolver: zodResolver(
      z.object({
        name: z.string().min(1, { message: t('Name is required') }),
      }),
    ),
  });
  const [showRenameTableDialog, setShowRenameTableDialog] = useState(false);
  const { mutate: renameTable, isPending: isRenamingTable } = useMutation({
    mutationFn: (newName: string) =>
      tablesApi.update(tableId, { name: newName }),
    onSuccess: () => {
      setShowRenameTableDialog(false);
      onRename();
      toast({
        title: t('Table renamed'),
        description: `${tableName} ${t('renamed to')} ${form.getValues(
          'name',
        )}`,
      });
    },
  });

  return (
    <Dialog
      open={showRenameTableDialog}
      onOpenChange={setShowRenameTableDialog}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent onClick={(e) => e.stopPropagation()}>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => renameTable(data.name))}>
            <DialogHeader>
              <DialogTitle>
                {t('Rename')} {tableName}
              </DialogTitle>
            </DialogHeader>
            <div className="mb-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input {...field} placeholder={t('Table name')} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              ></FormField>
            </div>
            <div className="flex justify-end gap-2">
              <DialogClose asChild>
                <Button variant="outline" type="button">
                  {t('Cancel')}
                </Button>
              </DialogClose>

              <Button type="submit" loading={isRenamingTable}>
                {t('Confirm')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

RenameTableDialog.displayName = 'RenameTableDialog';

export default RenameTableDialog;
