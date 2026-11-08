import { ProjectType } from '@activepieces/shared';
import { t } from 'i18next';
import { Check, FolderClosed } from 'lucide-react';
import { Suspense, useMemo, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { DataFetchErrorState } from '@/components/custom/data-fetch-error-state';
import { Button } from '@/components/ui/button';
import {
  ApProjectDisplay,
  getProjectName,
  projectCollectionUtils,
} from '@/features/projects';
import { userHooks } from '@/hooks/user-hooks';
import { authenticationSession } from '@/lib/authentication-session';

import { ProjectPickerData } from '../lib/message-parsers';

import { ChatCardSkeleton } from './chat-card-primitives';
import {
  ChatCard,
  ChatCardActions,
  ChatCardBody,
  ChatCardHeader,
  ChatCardTile,
} from './chat-ui/chat-card';
import { ChatLine } from './chat-ui/chat-line';
import { ChatOptionItem, ChatOptionList } from './chat-ui/chat-option';
import { ChatStatusText } from './chat-ui/chat-status';

export function ProjectPickerCard(props: ProjectPickerCardProps) {
  return (
    <ErrorBoundary
      fallbackRender={({ resetErrorBoundary }) => (
        <ProjectPickerError
          title={props.picker.question ?? t('Which project should I work in?')}
          onRetry={resetErrorBoundary}
          onDismiss={
            props.isInteractive === false ? undefined : props.onDismiss
          }
        />
      )}
    >
      <Suspense fallback={<ChatCardSkeleton />}>
        <ProjectPickerContent {...props} />
      </Suspense>
    </ErrorBoundary>
  );
}

function ProjectPickerError({
  title,
  onRetry,
  onDismiss,
}: {
  title: string;
  onRetry: () => void;
  onDismiss?: () => void;
}) {
  return (
    <ChatCard>
      <ChatCardHeader
        tile={<ChatCardTile kind="bits" icon={FolderClosed} />}
        title={title}
        titleLines={2}
      />
      <ChatCardBody>
        <DataFetchErrorState entity={t('projects')} onRetry={onRetry} />
      </ChatCardBody>
      {onDismiss && (
        <ChatCardActions>
          <Button
            size="sm"
            variant="ghost"
            className="text-gray-11"
            onClick={onDismiss}
          >
            {t('Skip')}
          </Button>
        </ChatCardActions>
      )}
    </ChatCard>
  );
}

function ProjectPickerContent({
  picker,
  onResolve,
  onDismiss,
  isInteractive = true,
  selectedProjectId,
  selectedProjectName,
}: ProjectPickerCardProps) {
  const { data: allProjects } = projectCollectionUtils.useAll();
  const { data: currentUser } = userHooks.useCurrentUser();
  const projects = useMemo(() => {
    const all = allProjects ?? [];
    if (!currentUser) return all;
    return all.filter(
      (p) => p.type !== ProjectType.PERSONAL || p.ownerId === currentUser.id,
    );
  }, [allProjects, currentUser]);

  const [selected, setSelected] = useState<string | null>(null);
  const [typedAnswer, setTypedAnswer] = useState<string | null>(null);
  const [picked, setPicked] = useState<string | null | undefined>(undefined);
  const [answer, setAnswer] = useState('');

  const suggestedProjects = picker.suggestedProjects ?? [];
  const title = picker.question ?? t('Which project should I work in?');
  const currentProjectId = authenticationSession.getProjectId();

  const ordered = useMemo(
    () =>
      orderProjects({
        projects,
        currentProjectId,
        suggestedIds: (picker.suggestedProjects ?? []).map((s) => s.id),
      }),
    [projects, currentProjectId, picker.suggestedProjects],
  );

  const defaultId = defaultPick({
    ordered,
    currentProjectId,
    suggestedIds: suggestedProjects.map((s) => s.id),
  });
  const explicitPick =
    picked !== undefined && ordered.some((p) => p.id === picked)
      ? picked
      : null;
  const pickedId = answer.trim()
    ? null
    : picked === undefined
    ? defaultId
    : explicitPick;

  function handlePick(projectId: string) {
    setPicked(projectId);
    setAnswer('');
  }

  function handleAnswerChange(value: string) {
    setAnswer(value);
    if (value.trim()) setPicked(null);
  }

  function handleSelect(projectId: string) {
    const project = ordered.find((p) => p.id === projectId);
    if (!project) return;
    setSelected(projectId);
    onResolve({ projectId, projectName: getProjectName(project) });
  }

  function handleTyped() {
    const value = answer.trim();
    if (!value) return;
    setTypedAnswer(value);
    onResolve({ projectName: value });
  }

  function handleContinue() {
    if (answer.trim()) {
      handleTyped();
      return;
    }
    if (pickedId) handleSelect(pickedId);
  }

  if (selected || typedAnswer || !isInteractive) {
    const projectId = selected ?? selectedProjectId ?? null;
    const resolvedProject = projectId
      ? projects.find((p) => p.id === projectId) ?? null
      : null;
    const displayName = resolveDisplayName({
      resolvedProject,
      projectId,
      typedAnswer,
      selectedProjectName,
      suggestedProjects,
    });
    return (
      <ChatLine
        icon={<Check className="size-3.5 text-success-11" />}
        detail={displayName || t('Project selected')}
      >
        {title}
      </ChatLine>
    );
  }

  const items: ChatOptionItem[] = ordered.map((project) => {
    const name = getProjectName(project);
    return {
      id: project.id,
      label: name,
      leading: (
        <ApProjectDisplay
          title={name}
          icon={project.icon}
          projectType={project.type}
          iconClassName="size-5 rounded"
          titleClassName="hidden"
          framePersonalIcon
        />
      ),
      trailing:
        project.id === currentProjectId ? t('Current project') : undefined,
    };
  });

  return (
    <ChatCard turn>
      <ChatCardHeader
        tile={<ChatCardTile kind="bits" icon={FolderClosed} />}
        title={title}
        titleLines={2}
        trailing={<ChatStatusText status="needs-you" />}
      />
      <ChatCardBody>
        <ChatOptionList
          items={items}
          mode="radio"
          selected={pickedId ? [pickedId] : []}
          onPick={handlePick}
          ariaLabel={title}
          searchPlaceholder={t('Search projects...')}
          noMatchText={() => t('No project found.')}
          writeYourOwn={{
            value: answer,
            onChange: handleAnswerChange,
            onSubmit: handleTyped,
            placeholder: t('Type your answer...'),
          }}
        />
      </ChatCardBody>
      <ChatCardActions>
        <Button
          size="sm"
          disabled={!pickedId && !answer.trim()}
          onClick={handleContinue}
        >
          {t('Continue')}
        </Button>
        {onDismiss && (
          <Button
            size="sm"
            variant="ghost"
            className="text-gray-11"
            onClick={onDismiss}
          >
            {t('Skip')}
          </Button>
        )}
      </ChatCardActions>
    </ChatCard>
  );
}

function orderProjects({
  projects,
  currentProjectId,
  suggestedIds,
}: {
  projects: ProjectItem[];
  currentProjectId: string | null;
  suggestedIds: string[];
}): ProjectItem[] {
  const rank = (project: ProjectItem): number => {
    const index = suggestedIds.indexOf(project.id);
    if (index !== -1) return index;
    return project.id === currentProjectId
      ? suggestedIds.length
      : suggestedIds.length + 1;
  };
  return [...projects].sort((a, b) => rank(a) - rank(b));
}

function defaultPick({
  ordered,
  currentProjectId,
  suggestedIds,
}: {
  ordered: ProjectItem[];
  currentProjectId: string | null;
  suggestedIds: string[];
}): string | null {
  const firstSuggested = ordered.find((p) => suggestedIds.includes(p.id));
  if (firstSuggested) return firstSuggested.id;
  return ordered.some((p) => p.id === currentProjectId)
    ? currentProjectId
    : null;
}

function resolveDisplayName({
  resolvedProject,
  projectId,
  typedAnswer,
  selectedProjectName,
  suggestedProjects,
}: {
  resolvedProject: ProjectItem | null;
  projectId: string | null;
  typedAnswer: string | null;
  selectedProjectName?: string | null;
  suggestedProjects: Array<{ id: string; name: string }>;
}): string {
  if (resolvedProject) return getProjectName(resolvedProject);
  if (typedAnswer) return typedAnswer;
  if (selectedProjectName) return selectedProjectName;
  if (projectId) {
    return suggestedProjects.find((p) => p.id === projectId)?.name ?? '';
  }
  return suggestedProjects[0]?.name ?? '';
}

type ProjectItem = NonNullable<
  ReturnType<typeof projectCollectionUtils.useAll>['data']
>[number];

type ProjectPickerCardProps = {
  picker: ProjectPickerData;
  onResolve: (payload: Record<string, unknown>) => void;
  onDismiss?: () => void;
  isInteractive?: boolean;
  selectedProjectId?: string | null;
  selectedProjectName?: string | null;
};
