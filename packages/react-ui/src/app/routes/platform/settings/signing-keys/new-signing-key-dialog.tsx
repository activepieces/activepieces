import { typeboxResolver } from '@hookform/resolvers/typebox';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { CopyToClipboardInput } from '@/components/custom/copy-to-clipboard';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { INTERNAL_ERROR_TOAST, useToast } from '@/components/ui/use-toast';
import { signingKeyApi } from '@/features/platform-admin-panel/lib/signing-key-api';
import {
  AddSigningKeyRequestBody,
  AddSigningKeyResponse,
} from '@activepieces/ee-shared';

type NewSigningKeyDialogProps = {
  children: React.ReactNode;
  onCreate: () => void;
};

export const NewSigningKeyDialog = ({
  children,
  onCreate,
}: NewSigningKeyDialogProps) => {
  const [open, setOpen] = useState(false);
  const [signingKey, setSigningKey] = useState<
    AddSigningKeyResponse | undefined
  >(undefined);
  const form = useForm<AddSigningKeyRequestBody>({
    resolver: typeboxResolver(AddSigningKeyRequestBody),
  });

  const { toast } = useToast();

  const { mutate, isPending } = useMutation({
    mutationFn: () => signingKeyApi.create(form.getValues()),
    onSuccess: (key) => {
      setSigningKey(key);
      onCreate();
    },
    onError: () => {
      toast(INTERNAL_ERROR_TOAST);
      setOpen(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={(open) => setOpen(open)}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {signingKey ? 'Signing Key Created' : 'Create New Signing Key'}
          </DialogTitle>
        </DialogHeader>
        {signingKey && (
          <div className="p-4">
            <div className="flex flex-col items-start gap-2">
              <span className="text-md">
                Please save this secret key somewhere safe and accessible. For
                security reasons,{' '}
                <span className="font-semibold">
                  you won&apos;t be able to view it again after closing this
                  dialog.
                </span>
              </span>
              <CopyToClipboardInput textToCopy={signingKey.privateKey} />
            </div>
          </div>
        )}
        {!signingKey && (
          <Form {...form}>
            <form
              className="grid space-y-4"
              onSubmit={(e) => e.preventDefault()}
            >
              <FormField
                name="displayName"
                render={({ field }) => (
                  <FormItem className="grid space-y-4">
                    <Label htmlFor="displayName">Signing Key Name</Label>
                    <Input
                      {...field}
                      required
                      id="displayName"
                      className="rounded-sm"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              {form?.formState?.errors?.root?.serverError && (
                <FormMessage>
                  {form.formState.errors.root.serverError.message}
                </FormMessage>
              )}
            </form>
          </Form>
        )}
        <DialogFooter>
          {!signingKey ? (
            <>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                disabled={isPending || !form.formState.isValid}
                loading={isPending}
                onClick={() => mutate()}
              >
                Save
              </Button>
            </>
          ) : (
            <Button
              variant={'secondary'}
              onClick={() => {
                setSigningKey(undefined);
                setOpen(false);
              }}
            >
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};