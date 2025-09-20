import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useState } from 'react';
import { SecretManagerMetaData } from '.';
import { t } from 'i18next';
import {
  Form,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { useMutation } from '@tanstack/react-query';
import { toast } from '@/components/ui/use-toast';

type ConnectSecretManagerDialogProps = {
  manager: SecretManagerMetaData;
  children: React.ReactNode;
};

const ConnectSecretManagerDialog = ({
  children,
  manager,
}: ConnectSecretManagerDialogProps) => {
  const [open, setOpen] = useState(false);
  const form = useForm();

  const { mutate, isPending } = useMutation({
    mutationFn: (): Promise<void> => {
      return Promise.resolve()
    },
    onSuccess: () => {
      form.reset();
      setOpen(false);
      toast({
        title: t("Success")
      })
    },
    onError: () => {
      setOpen(false);
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!open) {
          form.reset();
        }
        setOpen(open);
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t('Connect secret manager')} ({manager.name})
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form className="grid space-y-4" onSubmit={(e) => e.preventDefault()}>
            {
              manager.fields.map((fieldName)=> (
                <FormField
                  name={fieldName}
                  render={({ field }) => (
                    <FormItem className="grid space-y-3">
                      <Label htmlFor="fieldName">{fieldName}</Label>
                      <div className="flex gap-2 items-center justify-center">
                        <Input
                          autoFocus
                          {...field}
                          required
                          id={fieldName}
                          placeholder={t('************************')}
                          className="rounded-sm"
                        />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))
            }
          </form>
        </Form>
        <DialogFooter>
          <Button
            variant={'outline'}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setOpen(false);
            }}
          >
            {t('Cancel')}
          </Button>
          <Button
            disabled={!form.formState.isValid}
            loading={isPending}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              mutate();
            }}
          >
            {t('Save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConnectSecretManagerDialog;
