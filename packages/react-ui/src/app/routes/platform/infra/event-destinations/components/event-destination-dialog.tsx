import { t } from 'i18next';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

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
  ApplicationEventName,
  EventDestination,
  CreatePlatformEventDestinationRequestBody,
} from '@activepieces/ee-shared';

import { eventDestinationsCollectionUtils } from '../lib/event-destinations-collection';

interface EventDestinationDialogProps {
  children: React.ReactNode;
  destination: EventDestination | null;
}

export const EventDestinationDialog = ({
  children,
  destination,
}: EventDestinationDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<CreatePlatformEventDestinationRequestBody>({
    defaultValues: {
      url: destination?.url || '',
      events: destination?.events || [],
    },
  });

  const { mutate: testDestination, isPending: isTesting } =
    eventDestinationsCollectionUtils.useTestEventDestination();

  const { mutate: createDestination, isPending: isCreating } =
    eventDestinationsCollectionUtils.useCreateEventDestination(
      () => {
        toast.success(t('Success'), {
          description: t('Event destination created successfully'),
        });
        setIsOpen(false);
        form.reset();
      },
      (error: Error) => {
        toast.error(t('Error'), {
          description: error.message,
        });
      },
    );

  const handleSubmit = (data: CreatePlatformEventDestinationRequestBody) => {
    // Basic validation
    if (!data.url || data.url.trim() === '') {
      toast.error(t('Error'), {
        description: t('Please enter a valid URL'),
      });
      return;
    }

    if (!data.events || data.events.length === 0) {
      toast.error(t('Error'), {
        description: t('Please select at least one event'),
      });
      return;
    }

    if (destination) {
      // Update existing destination
      try {
        eventDestinationsCollectionUtils.update(destination.id, data);
        toast.success(t('Success'), {
          description: t('Event destination updated successfully'),
        });
        setIsOpen(false);
        form.reset();
      } catch (error) {
        toast.error(t('Error'), {
          description: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    } else {
      // Create new destination
      createDestination(data);
    }
  };

  const availableEvents = Object.values(ApplicationEventName);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {destination
              ? t('Update Event Destination')
              : t('Create Event Destination')}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Webhook URL')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://example.com/webhook"
                      {...field}
                    />
                  </FormControl>
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
                disabled={isCreating}
              >
                {t('Cancel')}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => testDestination({ url: form.getValues('url') })}
                disabled={form.getValues('url') === '' || isTesting}
              >
                {isTesting ? t('Testing...') : t('Test Destination')}
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating
                  ? t('...')
                  : destination
                  ? t('Update Destination')
                  : t('Create Destination')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
