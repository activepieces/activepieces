import { typeboxResolver } from '@hookform/resolvers/typebox';
import { Static, Type } from '@sinclair/typebox';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { api } from '@/lib/api';

const formSchema = Type.Object({
  packageName: Type.String({
    minLength: 1,
    errorMessage: t('The package name is required'),
  }),
});

type AddNpmDialogProps = {
  children: React.ReactNode;
  onAdd: ({
    packageName,
    packageVersion,
  }: {
    packageName: string;
    packageVersion: string;
  }) => void;
};
const AddNpmDialog = ({ children, onAdd }: AddNpmDialogProps) => {
  const [open, setOpen] = useState(false);
  const form = useForm<Static<typeof formSchema>>({
    defaultValues: {},
    resolver: typeboxResolver(formSchema),
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const { packageName } = form.getValues();
      const response = await api.get<{ 'dist-tags': { latest: string } }>(
        `https://registry.npmjs.org/${packageName}`,
      );
      return {
        packageName,
        packageVersion: response['dist-tags'].latest,
      };
    },
    onSuccess: (response) => {
      onAdd(response);
      setOpen(false);
      toast({
        title: t('Success'),
        description: t('Package added successfully'),
        duration: 3000,
      });
    },
    onError: () => {
      form.setError('root.serverError', {
        message: t('Could not fetch package version'),
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={(open) => setOpen(open)}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('Add NPM Package')}</DialogTitle>
          <DialogDescription>
            {t('Type the name of the npm package you want to add.')}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={(e) => form.handleSubmit(() => mutate())(e)}
            className="flex flex-col gap-4"
          >
            <FormField
              control={form.control}
              name="packageName"
              render={({ field }) => (
                <FormItem>
                  <Label htmlFor="packageName">{t('Package Name')}</Label>
                  <Input
                    {...field}
                    id="packageName"
                    type="text"
                    placeholder="hello-world"
                    className="rounded-sm"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormDescription>
              {t('The latest version will be fetched and added')}
            </FormDescription>
            {form?.formState?.errors?.root?.serverError && (
              <FormMessage>
                {form.formState.errors.root.serverError.message}
              </FormMessage>
            )}
          </form>
        </Form>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              {t('Cancel')}
            </Button>
          </DialogClose>
          <Button type="submit" loading={isPending} onClick={() => mutate()}>
            {t('Add')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

AddNpmDialog.displayName = 'AddNpmDialog';
export { AddNpmDialog };
