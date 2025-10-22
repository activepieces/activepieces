import { zodResolver } from '@hookform/resolvers/zod';
import { t } from 'i18next';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import {
  Alert,
  AlertChannel,
  MergedEventNames,
  CreateAlertParams,
  UpdateAlertParams,
} from '@activepieces/ee-shared';

import { alertMutations, MutateAlertParams } from '../lib/alert-hooks';

const formSchema = z.object({
  name: z.string().min(1, { message: t('Please enter a name') }),
  description: z.string().min(1, { message: t('Please enter a description') }),
  channel: z.nativeEnum(AlertChannel),
  receivers: z.array(z.string().email({ message: t('Please enter a valid email') })).min(1, {
    message: t('Please add at least one email address'),
  }),
  events: z.array(z.nativeEnum(MergedEventNames)).min(1, {
    message: t('Please select at least one event'),
  }),
});

type FormData = z.infer<typeof formSchema>;

interface CreateAlertDialogProps {
  children: React.ReactNode;
  alert: Alert | null;
}

export const CreateAlertDialog = ({
  children,
  alert,
}: CreateAlertDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [emailInput, setEmailInput] = useState('');

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: alert?.name || '',
      description: alert?.description || '',
      channel: alert?.channel || AlertChannel.EMAIL,
      receivers: alert?.receivers || [],
      events: alert?.events || [],
    },
  });

  const { mutate: mutateAlert, isPending } = alertMutations.useMutateAlert({
    setOpen: setIsOpen,
    form,
  });

  const watchedReceivers = form.watch('receivers');

  const handleSubmit = (data: FormData) => {
    let request: MutateAlertParams = {
      name: data.name,
      description: data.description,
      channel: data.channel,
      receivers: data.receivers,
      events: data.events,
    };

    if (alert) {
      request = {
        id: alert.id,
        ...request,
      };
    }

    mutateAlert(request);
  };

  const addEmail = () => {
    if (emailInput.trim() && !watchedReceivers.includes(emailInput.trim())) {
      form.setValue('receivers', [...watchedReceivers, emailInput.trim()]);
      setEmailInput('');
    }
  };

  const removeEmail = (emailToRemove: string) => {
    form.setValue(
      'receivers',
      watchedReceivers.filter((email) => email !== emailToRemove)
    );
  };

  const availableEvents = Object.values(MergedEventNames);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {alert ? t('Update Alert') : t('Create Alert')}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Alert Name')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('Enter alert name')}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Description')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('Enter alert description')}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="channel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Channel')}</FormLabel>
                  <Select
                    disabled={!!alert}
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('Select channel')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={AlertChannel.EMAIL}>
                        {t('Email')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="receivers"
              render={() => (
                <FormItem>
                  <FormLabel>{t('Email Recipients')}</FormLabel>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        type="email"
                        placeholder={t('Enter email address')}
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addEmail();
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={addEmail}
                        disabled={!emailInput.trim()}
                      >
                        {t('Add')}
                      </Button>
                    </div>
                    <div className="space-y-1">
                      {watchedReceivers.map((email) => (
                        <div
                          key={email}
                          className="flex items-center justify-between rounded-md border p-2"
                        >
                          <span className="text-sm">{email}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeEmail(email)}
                          >
                            {t('Remove')}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                                          field.value?.filter(
                                            (value) => value !== event,
                                          ),
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
                {isPending
                  ? t('...')
                  : alert
                  ? t('Update Alert')
                  : t('Create Alert')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
