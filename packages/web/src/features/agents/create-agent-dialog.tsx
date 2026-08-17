import {
  AgentIcon,
  AgentTemplate,
  ColorName,
  DraftAgentResponse,
  formErrors,
} from '@activepieces/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { t } from 'i18next';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { projectCollectionUtils } from '@/features/projects';
import { cn } from '@/lib/utils';

import { AgentMark } from './agent-mark';
import { agentsMutations, agentsQueries } from './hooks/agents-hooks';
import { createAgentUtils } from './lib/create-agent-utils';

const CreateAgentFormSchema = z.object({
  displayName: z.string().min(1, formErrors.required),
  description: z.string(),
  instructions: z.string().min(1, formErrors.required),
  icon: z.enum(AgentIcon),
  color: z.enum(ColorName),
});

type CreateAgentFormValues = z.infer<typeof CreateAgentFormSchema>;

const buildDefaultValues = (
  draft: DraftAgentResponse | null,
): CreateAgentFormValues => ({
  displayName: draft?.displayName ?? '',
  description: draft?.description ?? '',
  instructions: draft?.instructions ?? '',
  icon: draft?.icon ?? AgentIcon.BOT,
  color: draft?.color ?? ColorName.PURPLE,
});

const TemplateTile = ({
  template,
  onSelect,
}: {
  template: AgentTemplate;
  onSelect: () => void;
}) => (
  <button
    type="button"
    onClick={onSelect}
    className="flex items-center gap-3 rounded-[14px] border border-border p-3 text-left transition-colors hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
  >
    <AgentMark icon={template.icon} color={template.color} size="sm" />
    <span className="flex min-w-0 flex-col gap-[2px]">
      <span className="truncate text-sm font-semibold">
        {template.displayName}
      </span>
      <span className="line-clamp-1 text-[13px] leading-4 text-muted-foreground">
        {template.description}
      </span>
    </span>
  </button>
);

const CreateAgentForm = ({
  draft,
  onOpenChange,
}: {
  draft: DraftAgentResponse | null;
  onOpenChange: (open: boolean) => void;
}) => {
  const { project } = projectCollectionUtils.useCurrentProject();
  const navigate = useNavigate();
  const form = useForm<CreateAgentFormValues>({
    resolver: zodResolver(CreateAgentFormSchema),
    defaultValues: buildDefaultValues(draft),
    mode: 'onChange',
  });
  const createAgent = agentsMutations.useCreateAgent({
    onSuccess: (agent) => {
      onOpenChange(false);
      navigate(`/projects/${agent.projectId}/agents/${agent.id}`);
    },
    onError: () =>
      form.setError('root.serverError', {
        type: 'manual',
        message: t("The agent wasn't saved. Try again."),
      }),
  });

  const handleSubmit = (values: CreateAgentFormValues) => {
    form.clearErrors('root.serverError');
    createAgent.mutate(
      createAgentUtils.buildCreateRequest({
        draft: values,
        projectId: project.id,
      }),
    );
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="flex flex-col gap-4"
      >
        <FormField
          control={form.control}
          name="displayName"
          render={({ field }) => (
            <FormItem>
              <FormLabel showRequiredIndicator>{t('Name')}</FormLabel>
              <FormControl>
                <Input {...field} placeholder={t('Research analyst')} />
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
                <Input
                  {...field}
                  placeholder={t('Searches the web, returns a cited brief.')}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="instructions"
          render={({ field }) => (
            <FormItem>
              <FormLabel showRequiredIndicator>{t('Instructions')}</FormLabel>
              <FormControl>
                <Textarea {...field} minRows={4} maxRows={10} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('Color')}</FormLabel>
              <div className="flex flex-wrap items-center gap-2">
                {Object.values(ColorName).map((colorName) => (
                  <button
                    key={colorName}
                    type="button"
                    aria-label={colorName}
                    onClick={() => field.onChange(colorName)}
                    className={cn(
                      'rounded-[14px]',
                      field.value === colorName &&
                        'ring-2 ring-foreground ring-offset-2',
                    )}
                  >
                    <AgentMark
                      icon={form.watch('icon')}
                      color={colorName}
                      size="sm"
                    />
                  </button>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        {form.formState.errors.root?.serverError && (
          <p className="text-sm text-destructive">
            {form.formState.errors.root.serverError.message}
          </p>
        )}
        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t('Cancel')}
          </Button>
          <Button type="submit" loading={createAgent.isPending}>
            {t('Create agent')}
          </Button>
        </div>
      </form>
    </Form>
  );
};

const StartStep = ({
  onPicked,
}: {
  onPicked: (draft: DraftAgentResponse | null) => void;
}) => {
  const { data: templates, isLoading } = agentsQueries.useAgentTemplates();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">{t('Start from a template')}</p>
        <Button
          type="button"
          variant="link"
          size="sm"
          onClick={() => onPicked(null)}
        >
          {t('Start blank')}
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {isLoading
          ? [0, 1, 2, 3].map((index) => (
              <Skeleton key={index} className="h-[62px] rounded-[14px]" />
            ))
          : (templates?.data ?? []).map((template) => (
              <TemplateTile
                key={template.id}
                template={template}
                onSelect={() => onPicked(template)}
              />
            ))}
      </div>
    </div>
  );
};

const CreateAgentDialogBody = ({
  onOpenChange,
}: {
  onOpenChange: (open: boolean) => void;
}) => {
  const [draft, setDraft] = useState<DraftAgentResponse | null>(null);
  const [reviewing, setReviewing] = useState(false);

  if (!reviewing) {
    return (
      <StartStep
        onPicked={(picked) => {
          setDraft(picked);
          setReviewing(true);
        }}
      />
    );
  }
  return <CreateAgentForm draft={draft} onOpenChange={onOpenChange} />;
};

export const CreateAgentDialog = ({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-[640px]">
      <DialogHeader>
        <DialogTitle>{t('New agent')}</DialogTitle>
        <DialogDescription>
          {t('Start from a template, or build one from scratch.')}
        </DialogDescription>
      </DialogHeader>
      <CreateAgentDialogBody
        key={open ? 'open' : 'closed'}
        onOpenChange={onOpenChange}
      />
    </DialogContent>
  </Dialog>
);
