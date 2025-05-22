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
import { mcpApi } from '@/features/mcp/lib/mcp-api'; // Corrected path

type RenameMcpDialogProps = {
  mcpName: string;
  mcpId: string;
  onRename: () => void;
  children: React.ReactNode;
};

const RenameMcpDialog = ({
  mcpName,
  mcpId,
  onRename,
  children,
}: RenameMcpDialogProps) => {
  const form = useForm<{ name: string }>({
    defaultValues: {
      name: mcpName,
    },
    resolver: zodResolver(
      z.object({
        name: z.string().min(1, { message: t('Name is required') }),
      }),
    ),
  });

  const [showRenameMcpDialog, setShowRenameMcpDialog] = useState(false);

  const { mutate: renameMcpServer, isPending: isRenamingMcp } = useMutation({
    mutationFn: async (newName: string) => {
      return mcpApi.update(mcpId, { name: newName });
    },
    onSuccess: () => {
      setShowRenameMcpDialog(false);
      onRename();
      toast({
        title: t('MCP Server Renamed successfully'),
        duration: 3000,
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('Error Renaming MCP Server'),
        description: error.message || t('An unexpected error occurred.'),
        variant: 'destructive',
        duration: 5000,
      });
    },
  });

  return (
    <Dialog open={showRenameMcpDialog} onOpenChange={setShowRenameMcpDialog}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent onClick={(e) => e.stopPropagation()}>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) => renameMcpServer(data.name))}
          >
            <DialogHeader>
              <DialogTitle>
                {t('Rename')} {mcpName}
              </DialogTitle>
            </DialogHeader>
            <div className="my-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t('New MCP Server Name')}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex justify-end gap-2">
              <DialogClose asChild>
                <Button variant="outline" type="button">
                  {t('Cancel')}
                </Button>
              </DialogClose>
              <Button type="submit" loading={isRenamingMcp}>
                {t('Confirm')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

RenameMcpDialog.displayName = 'RenameMcpServerDialog';
export default RenameMcpDialog;
