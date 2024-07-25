import { ApEdition, ApFlagId } from '@activepieces/shared';
import { typeboxResolver } from '@hookform/resolvers/typebox';
import { Static, Type } from '@sinclair/typebox';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

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

const logos = [
  'https://www.activepieces.com/logos/alan.svg',
  'https://www.activepieces.com/logos/contentful.svg',
  'https://www.activepieces.com/logos/plivo.svg',
  'https://www.activepieces.com/logos/clickup.svg',
];

const features = [
  {
    label: 'Multiple Projects',
    key: `PROJECTS`,
  },
  { label: 'Brand Activepieces', key: 'BRANDING' },
  { label: 'Control Pieces', key: 'PIECES' },
  { label: 'Enterprise Pieces', key: 'ENTERPRISE_PIECES' },
  {
    label: 'Custom Templates',
    key: `TEMPLATES`,
  },
  { label: 'Access Full API', key: `API` },
  { label: 'Single Sign On', key: `SSO` },
  { label: 'Audit Logs', key: `AUDIT_LOGS` },
  {
    label: 'Team Collaboration via Git',
    key: `GIT_SYNC`,
  },
  {
    label: 'Alerts on Failed Runs',
    key: `ISSUES`,
  },
];

const goals = [
  {
    label: 'Internal automations in my company',
    key: `INTERNAL_AUTOMATIONS`,
  },
  {
    label: 'Embed Activepieces in our SaaS product',
    key: `EMBED_ACTIVEPIECES`,
  },
  {
    label: 'Resell Activepieces to clients',
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
    errorMessage: 'Name is required',
  }),
  email: Type.String({
    errorMessage: 'Email is required',
  }),
  companyName: Type.String({
    errorMessage: 'Company name is required',
  }),
  numberOfEmployees: Type.String({
    errorMessage: 'Number of employees is required',
  }),
  goal: Type.String({
    errorMessage: 'Goal is required',
  }),
});
type FormSchema = Static<typeof formSchema>;

export const RequestTrial = () => {
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

  const queryClient = useQueryClient();
  const { data: edition } = flagsHooks.useFlag<ApEdition>(
    ApFlagId.EDITION,
    queryClient,
  );

  const { mutate, isPending } = useMutation<
    { message?: string },
    Error,
    FormSchema
  >({
    mutationFn: async (request) => {
      await requestTrialApi.contactSales(request);
      switch (edition) {
        case ApEdition.CLOUD: {
          return {
            message: 'Our sales team will be in contact with you soon.',
          };
        }
        case ApEdition.ENTERPRISE:
        case ApEdition.COMMUNITY: {
          await requestTrialApi.createKey(request);
          return {
            message:
              'Please check your email for your trial key and further instructions.',
          };
        }
        default: {
          throw new Error('Unexpected edition ' + edition);
        }
      }
    },
    onSuccess: (response) => {
      toast({
        title: 'Success',
        description: response.message,
        duration: 3000,
      });
      setIsOpen(false);
    },
    onError: (error) => {
      if (api.isError(error) && error.response?.status === 409) {
        form.setError('root.serverError', {
          message: 'Email is already used for a trial',
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
        <Button variant="outline">Request Trial</Button>
      </DrawerTrigger>
      <DrawerContent className="h-screen top-0 right-0 left-auto mt-0 w-[600px] rounded-none py-2 px-6 gap-6 flex">
        <DrawerHeader className="mt-4">
          <DrawerTitle className="text-2xl">
            14-Day Enterprise Trial
          </DrawerTitle>
        </DrawerHeader>
        <Form {...form}>
          <form className="space-y-2">
            <div className="grid grid-cols-2 gap-y-2 gap-x-6">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Bertram Gilfoyle" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Work Email</FormLabel>
                    <FormControl>
                      <Input placeholder="gilfoyle@piedpiper.com" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Pied Piper" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="numberOfEmployees"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Employees</FormLabel>
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
                  <FormLabel>Goal</FormLabel>
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
        <div className="flex flex-col">
          <div className="text-lg">Try Enterprise to access:</div>
          <div className="grid grid-cols-2 mt-4 gap-y-2 gap-x-6">
            {features.map((feature) => (
              <div className="flex gap-2 items-center my-3" key={feature.key}>
                <CheckCircle className="h-5 w-5 text-success" />
                {feature.label}
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-5 mt-6 items-center justify-center">
          <div className="text-lg text-muted-foreground font-semibold">
            Deploy your automations securely with Activepieces
          </div>
          <div className="flex flex-wrap gap-5 items-center justify-center">
            {logos.map((logo, index) => (
              <img key={index} className="h-6" src={logo} />
            ))}
          </div>
        </div>

        <div className="flex-grow"></div>
        <DrawerFooter className="flex flex-row items-center justify-left">
          <Button
            size={'lg'}
            onClick={form.handleSubmit((data) => mutate(data))}
            loading={isPending}
          >
            Submit
          </Button>
          <DrawerClose asChild>
            <Button variant="outline" size={'lg'}>
              Cancel
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
