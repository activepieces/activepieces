import { typeboxResolver } from '@hookform/resolvers/typebox';
import { Static, Type } from '@sinclair/typebox';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { Lock, Unlock } from 'lucide-react';
import { useState, forwardRef } from 'react';
import { useForm } from 'react-hook-form';

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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import { oauthAppsApi } from '@/features/connections/lib/oauth2-apps-api';
import { oauth2AppsHooks } from '@/features/connections/lib/oauth2-apps-hooks';
import { UpsertOAuth2AppRequest } from '@activepieces/ee-shared';
import { isNil } from '@activepieces/shared';

type ConfigurePieceOAuth2DialogProps = {
  pieceName: string;
};

const OAuth2FormValues = Type.Object({
  clientId: Type.String({
    minLength: 1,
  }),
  clientSecret: Type.String({
    minLength: 1,
  }),
});
type OAuth2FormValues = Static<typeof OAuth2FormValues>;

export const ConfigurePieceOAuth2Dialog = forwardRef<
  HTMLButtonElement,
  ConfigurePieceOAuth2DialogProps
>(({ pieceName }, ref) => {
  const [open, setOpen] = useState(false);
  const form = useForm<OAuth2FormValues>({
    resolver: typeboxResolver(OAuth2FormValues),
  });

  const { oauth2App, refetch } =
    oauth2AppsHooks.useOAuth2AppConfigured(pieceName);

  const { mutate: deleteOAuth2App, isPending: isDeleting } = useMutation({
    mutationFn: async (credentialId: string) => {
      await oauthAppsApi.delete(credentialId);
      await refetch();
    },
    onSuccess: () => {
      toast({
        title: t('Success'),
        description: t('OAuth2 Credentials Deleted'),
        duration: 3000,
      });
      setOpen(false);
    },
    onError: (error) => {
      console.error(error);
      toast(INTERNAL_ERROR_TOAST);
    },
  });

  const { mutate: upsert, isPending: isUpserting } = useMutation({
    mutationFn: async (request: UpsertOAuth2AppRequest) => {
      await oauthAppsApi.upsert(request);
      await refetch();
    },
    onSuccess: () => {
      toast({
        title: t('Success'),
        description: t('OAuth2 Credentials Updated'),
        duration: 3000,
      });
      setOpen(false);
    },
    onError: (error) => {
      console.error(error);
      toast(INTERNAL_ERROR_TOAST);
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
      <DialogTrigger asChild>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              ref={ref}
              size={'sm'}
              variant={'ghost'}
              loading={isUpserting || isDeleting}
              onClick={(e) => {
                if (isNil(oauth2App)) {
                  setOpen(true);
                } else {
                  deleteOAuth2App(oauth2App.id);
                }
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              {isNil(oauth2App) ? (
                <Unlock className="size-4" />
              ) : (
                <Lock className="size-4 text-destructive" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {isNil(oauth2App)
              ? t('Configure OAuth2 APP')
              : t('Delete OAuth2 APP')}
          </TooltipContent>
        </Tooltip>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Configure OAuth2 APP')}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            className="grid space-y-4 mt-4"
            onSubmit={form.handleSubmit((data) => {
              upsert({
                clientId: data.clientId,
                clientSecret: data.clientSecret,
                pieceName,
              });
            })}
          >
            <FormField
              name="clientId"
              render={({ field }) => (
                <FormItem className="grid space-y-4">
                  <Label htmlFor="clientId">{t('Client ID')}</Label>
                  <Input
                    {...field}
                    required
                    id="clientId"
                    className="rounded-sm"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="clientSecret"
              render={({ field }) => (
                <FormItem className="grid space-y-4">
                  <Label htmlFor="clientSecret">{t('Client Secret')}</Label>
                  <Input
                    {...field}
                    required
                    id="clientSecret"
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

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                {t('Cancel')}
              </Button>
              <Button
                loading={isUpserting}
                disabled={!form.formState.isValid}
                type="submit"
              >
                {t('Save')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
});

ConfigurePieceOAuth2Dialog.displayName = 'ConfigurePieceOAuth2Dialog';
