import { typeboxResolver } from '@hookform/resolvers/typebox';
import { Static, Type } from '@sinclair/typebox';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { CheckCircle } from 'lucide-react';
import { ReactNode, useState } from 'react';
import { useForm } from 'react-hook-form';

import { useTelemetry } from '@/components/telemetry-provider';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { INTERNAL_ERROR_TOAST, useToast } from '@/components/ui/use-toast';
import { flagsHooks } from '@/hooks/flags-hooks';
import { api } from '@/lib/api';
import { authenticationSession } from '@/lib/authentication-session';
import { requestTrialApi } from '@/lib/request-trial-api';
import { ApEdition, ApFlagId, TelemetryEventName } from '@activepieces/shared';

const logos = [
  'https://www.activepieces.com/logos/alan.svg',
  'https://www.activepieces.com/logos/contentful.svg',
  'https://www.activepieces.com/logos/plivo.svg',
  'https://www.activepieces.com/logos/clickup.svg',
];

export type FeatureKey =
  | 'PROJECTS'
  | 'BRANDING'
  | 'PIECES'
  | 'TEMPLATES'
  | 'TEAM'
  | 'GLOBAL_CONNECTIONS'
  | 'USERS'
  | 'API'
  | 'SSO'
  | 'AUDIT_LOGS'
  | 'GIT_SYNC'
  | 'ISSUES'
  | 'ANALYTICS'
  | 'ALERTS'
  | 'ENTERPRISE_PIECES'
  | 'UNIVERSAL_AI'
  | 'SIGNING_KEYS'
  | 'CUSTOM_ROLES';

const features = [
  {
    label: t('Multiple Projects'),
    key: `PROJECTS`,
  },
  { label: t('Brand Activepieces'), key: 'BRANDING' },
  { label: t('Control Pieces'), key: 'PIECES' },
  {
    label: t('Custom Templates'),
    key: `TEMPLATES`,
  },
  { label: t('Access Full API'), key: `API` },
  { label: t('Single Sign On'), key: `SSO` },
  { label: t('Audit Logs'), key: `AUDIT_LOGS` },
  {
    label: t('Team Collaboration via Git'),
    key: `GIT_SYNC`,
  },
  {
    label: t('Alerts on Failed Runs'),
    key: `ISSUES`,
  },
  {
    label: t('Global Connections'),
    key: `GLOBAL_CONNECTIONS`,
  },
  {
    label: t('Custom Roles'),
    key: `CUSTOM_ROLES`,
  },
  {
    label: t('Analytics'),
    key: `ANALYTICS`,
  },
  {
    label: t('Universal AI'),
    key: `UNIVERSAL_AI`,
  },
  {
    label: t('Embedding'),
    key: `SIGNING_KEYS`,
  },
];

const goals = [
  {
    label: t('Internal automations in my company'),
    key: `INTERNAL_AUTOMATIONS`,
  },
  {
    label: t('Embed Activepieces in our SaaS product'),
    key: `EMBED_ACTIVEPIECES`,
  },
  {
    label: t('Resell Activepieces to clients'),
    key: `RESELL_ACTIVEPIECES`,
  },
];

const numberOfEmployeesOptions = [
  '1,000+',
  '501 - 1000',
  '101 - 500',
  '51 - 100',
  '1 - 50',
];

const formSchema = Type.Object({
  fullName: Type.String({
    errorMessage: t('Name is required'),
  }),
  email: Type.String({
    errorMessage: t('Email is required'),
  }),
  companyName: Type.String({
    errorMessage: t('Company name is required'),
  }),
  numberOfEmployees: Type.String({
    errorMessage: t('Number of employees is required'),
  }),
  goal: Type.String({
    errorMessage: t('Goal is required'),
  }),
});
type FormSchema = Static<typeof formSchema>;

type RequestTrialProps = {
  featureKey: FeatureKey;
  customButton?: ReactNode;
};
export const RequestTrial = ({
  featureKey,
  customButton = t('Request Trial'),
}: RequestTrialProps) => {
  const { capture } = useTelemetry();
  const currentUser = authenticationSession.getCurrentUser();
  const form = useForm<FormSchema>({
    resolver: typeboxResolver(formSchema),
    defaultValues: {
      email: currentUser?.email ?? '',
      fullName: currentUser
        ? currentUser.firstName + ' ' + currentUser.lastName
        : '',
    },
  });
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);

  const { mutate, isPending } = useMutation<
    { message?: string },
    Error,
    FormSchema
  >({
    mutationFn: async (request) => {
      await requestTrialApi.contactSales(request);
      capture({
        name: TelemetryEventName.REQUEST_TRIAL_SUBMITTED,
        payload: request,
      });
      switch (edition) {
        case ApEdition.CLOUD: {
          return {
            message: t('Our sales team will be in contact with you soon.'),
          };
        }
        case ApEdition.ENTERPRISE:
        case ApEdition.COMMUNITY: {
          await requestTrialApi.createKey(request);
          return {
            message: t(
              'Please check your email for your trial key and further instructions.',
            ),
          };
        }
        default: {
          throw new Error(t('Unexpected edition') + edition);
        }
      }
    },
    onSuccess: (response) => {
      toast({
        title: t('Success'),
        description: response.message,
        duration: 3000,
      });

      setIsOpen(false);
    },
    onError: (error) => {
      if (api.isError(error) && error.response?.status === 409) {
        form.setError('root.serverError', {
          message: t('Email is already used for a trial'),
        });
        return;
      }
      toast(INTERNAL_ERROR_TOAST);
    },
  });

  return (
    <Drawer
      direction="right"
      open={isOpen}
      onOpenChange={(open) => setIsOpen(open)}
    >
      <DrawerTrigger asChild>
        <Button
          onClick={() =>
            capture({
              name: TelemetryEventName.REQUEST_TRIAL_CLICKED,
              payload: {
                location: featureKey,
              },
            })
          }
        >
          {customButton}
        </Button>
      </DrawerTrigger>
      <DrawerContent className="h-full top-0 right-0 left-auto mt-0 w-[620px] rounded-none py-2 ">
        <ScrollArea
          className="h-full w-full relative px-6 "
          viewPortClassName="h-full"
        >
          <DrawerHeader className="mt-4">
            <DrawerTitle className="text-2xl">
              {t('14-Day Enterprise Trial')}
            </DrawerTitle>
          </DrawerHeader>
          <Form {...form}>
            <form className="space-y-2 mt-4">
              <div className="grid grid-cols-2 gap-y-4 gap-x-6 px-0.5">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('Name')} *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('Work Email')} *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('Company Name')} *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="numberOfEmployees"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('Number of Employees')} *</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              {numberOfEmployeesOptions.map((option) => (
                                <SelectItem value={option} key={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="goal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Goal')} *</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {goals.map((goal) => (
                              <SelectItem value={goal.key} key={goal.key}>
                                {goal.label}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </FormControl>
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
          <div className="flex flex-col mt-8">
            <div className="text-lg">{t('Try Enterprise to access')}:</div>
            <div className="grid grid-cols-2 mt-4 gap-y-5 gap-x-6">
              {features.map((feature) => (
                <div className="flex gap-2 items-center " key={feature.key}>
                  <CheckCircle className="h-5 w-5 text-success" />
                  {feature.label}
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-5 mt-7 items-center justify-center">
            <div className="text-lg text-muted-foreground font-semibold">
              {t('Deploy your automations securely with Activepieces')}
            </div>
            <div className="flex flex-wrap gap-5 items-center justify-center">
              {logos.map((logo, index) => (
                <img key={index} className="h-6" src={logo} />
              ))}
            </div>
          </div>

          <div className="flex-grow"></div>
        </ScrollArea>
        <DrawerFooter className="flex flex-row sticky bg-background border-t border-border border-t  pb-0 z-50 bottom-0 items-center  justify-left">
          <Button
            size="default"
            onClick={form.handleSubmit((data) => mutate(data))}
            loading={isPending}
          >
            {t('Submit')}
          </Button>
          <DrawerClose asChild>
            <Button variant="outline" size="default">
              {t('Cancel')}
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
