import { zodResolver } from '@hookform/resolvers/zod';
import { t } from 'i18next';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { CreateOutgoingWebhookRequestBody, ApplicationEventName, OutgoingWebhook, UpdateOutgoingWebhookRequestBody } from '@activepieces/ee-shared';
import { Project } from '@activepieces/shared';
import { OutgoingWebhookScope } from '@activepieces/ee-shared';
import { outgoingWebhooksHooks } from '../lib/outgoing-webhooks-hooks';
import { toast } from '@/components/ui/use-toast';

const formSchema = z.object({
  url: z.string().url({ message: t('Please enter a valid URL') }),
  scope: z.nativeEnum(OutgoingWebhookScope),
  projectId: z.string().optional(),
  events: z.array(z.nativeEnum(ApplicationEventName)).min(1, {
    message: t('Please select at least one event'),
  }),
});

type FormData = z.infer<typeof formSchema>;

interface OutgoingWebhookDialogProps {
  children: React.ReactNode;
  webhook: OutgoingWebhook | null;
  projects: Project[];
}

export const OutgoingWebhookDialog = ({ children, webhook, projects }: OutgoingWebhookDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: webhook?.url || '',
      scope: webhook?.scope || OutgoingWebhookScope.PLATFORM,
      events: webhook?.events || [],
      projectId: webhook?.scope === OutgoingWebhookScope.PROJECT ? webhook?.projectId : undefined,
    },
  });

  const { mutate: mutateWebhook, isPending } = outgoingWebhooksHooks.useMutateOutgoingWebhook();

  const watchedScope = form.watch('scope');

  const handleSubmit = (data: FormData) => {
    let request: CreateOutgoingWebhookRequestBody | UpdateOutgoingWebhookRequestBody = {
      url: data.url,
      events: data.events,
    }

    if (!webhook) {
      request = {
        scope: data.scope,
        ...request,
        ...(data.scope === OutgoingWebhookScope.PROJECT && data.projectId && {
          projectId: data.projectId,
        }),
      } as CreateOutgoingWebhookRequestBody;
    }

    mutateWebhook({id: webhook?.id || '', data: request}, {
      onSuccess: () => {
        toast({
          title: t('Success'),
          description: t(`Outgoing webhook ${webhook ? 'updated' : 'created'} successfully`),
          duration: 3000,
        });
        setIsOpen(false);
        form.reset();
      },
      onError: (error: Error) => {
        toast({
          title: t('Error'),
          description: error.message,
          variant: 'destructive',
        });
      },
    });
  };

  const availableEvents = Object.values(ApplicationEventName);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('Create Outgoing Webhook')}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Webhook URL')}</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/webhook" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="scope"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Scope')}</FormLabel>
                  <Select disabled={!!webhook} onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('Select scope')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={OutgoingWebhookScope.PLATFORM}>
                        {t('Platform')}
                      </SelectItem>
                      <SelectItem value={OutgoingWebhookScope.PROJECT}>
                        {t('Project')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {watchedScope === OutgoingWebhookScope.PROJECT && (
              <FormField
                control={form.control}
                name="projectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Project')}</FormLabel>
                    <Select disabled={!!webhook} onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('Select project')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {projects?.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.displayName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="events"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel className="text-base">{t('Events')}</FormLabel>
                  </div>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                    {availableEvents.map((event) => (
                      <FormField
                        key={event}
                        control={form.control}
                        name="events"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={event}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(event)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, event])
                                      : field.onChange(
                                          field.value?.filter((value) => value !== event)
                                        );
                                  }}
                                />
                              </FormControl>
                              <Label className="text-sm font-normal">
                                {event.replace(/_/g, ' ')}
                              </Label>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isPending}
              >
                {t('Cancel')}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? t('...') : webhook ? t('Update Webhook') : t('Create Webhook')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
