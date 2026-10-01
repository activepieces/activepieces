import { zodResolver } from '@hookform/resolvers/zod';
import { t } from 'i18next';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { ConfirmDialog } from '@/components/custom/confirm-dialog';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { oauthAppsMutations, oauthAppsQueries } from '@/features/connections';

const ConfigurePieceOAuth2Dialog = ({
  pieceName,
  pieceDisplayName,
  open,
  onOpenChange,
  onConfigurationDone,
}: ConfigurePieceOAuth2DialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{t('Configure OAuth app')}</DialogTitle>
        <DialogDescription>
          {t(
            'Builders connect {piece} through your own OAuth app instead of the default one.',
            { piece: pieceDisplayName },
          )}
        </DialogDescription>
      </DialogHeader>
      <OAuth2AppForm
        key={open ? `${pieceName}:open` : 'closed'}
        pieceName={pieceName}
        onOpenChange={onOpenChange}
        onConfigurationDone={onConfigurationDone}
      />
    </DialogContent>
  </Dialog>
);

const OAuth2AppForm = ({
  pieceName,
  onOpenChange,
  onConfigurationDone,
}: Omit<ConfigurePieceOAuth2DialogProps, 'open' | 'pieceDisplayName'>) => {
  const form = useForm<OAuth2FormValues>({
    resolver: zodResolver(OAuth2FormValues),
    defaultValues: emptyOAuth2FormValues(),
    mode: 'onChange',
  });
  const { refetch } = oauthAppsQueries.useOAuthAppConfigured(pieceName);
  const { mutate: upsert, isPending } = oauthAppsMutations.useUpsertOAuthApp(
    refetch,
    onOpenChange,
    onConfigurationDone,
  );

  return (
    <Form {...form}>
      <form
        className="flex flex-col gap-4"
        onSubmit={form.handleSubmit((data) =>
          upsert({
            clientId: data.clientId,
            clientSecret: data.clientSecret,
            pieceName,
          }),
        )}
      >
        <FormField
          control={form.control}
          name="clientId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('Client ID')}</FormLabel>
              <FormControl>
                <Input {...field} autoFocus autoComplete="off" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="clientSecret"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('Client secret')}</FormLabel>
              <FormControl>
                <Input {...field} type="password" autoComplete="off" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {form.formState.errors.root?.serverError && (
          <FormMessage>
            {form.formState.errors.root.serverError.message}
          </FormMessage>
        )}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t('Cancel')}
          </Button>
          <Button
            type="submit"
            loading={isPending}
            disabled={!form.formState.isValid}
          >
            {t('Save')}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
};

const RemovePieceOAuth2Dialog = ({
  pieceName,
  pieceDisplayName,
  open,
  onOpenChange,
  onConfigurationDone,
}: ConfigurePieceOAuth2DialogProps) => {
  const { oauth2App, refetch } =
    oauthAppsQueries.useOAuthAppConfigured(pieceName);
  const { mutateAsync: deleteOAuth2App } = oauthAppsMutations.useDeleteOAuthApp(
    refetch,
    onOpenChange,
  );
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('Remove the OAuth app for {piece}?', {
        piece: pieceDisplayName,
      })}
      description={t(
        'Builders authorize through the default app again instead.',
      )}
      consequence={t(
        'Existing connections made through this app stop refreshing.',
      )}
      confirmLabel={t('Remove')}
      onConfirm={async () => {
        if (oauth2App) {
          await deleteOAuth2App(oauth2App.id);
        }
        onConfigurationDone();
      }}
    />
  );
};

const emptyOAuth2FormValues = (): OAuth2FormValues => ({
  clientId: '',
  clientSecret: '',
});

const OAuth2FormValues = z.object({
  clientId: z.string().min(1),
  clientSecret: z.string().min(1),
});

export { ConfigurePieceOAuth2Dialog, RemovePieceOAuth2Dialog };

type OAuth2FormValues = z.infer<typeof OAuth2FormValues>;

type ConfigurePieceOAuth2DialogProps = {
  pieceName: string;
  pieceDisplayName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfigurationDone: () => void;
};
