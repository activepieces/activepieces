import { isNil, SeekPage } from '@activepieces/core-utils';
import {
  ApplicationEvent,
  ApplicationEventName,
  buildMockEvent,
  CreatePlatformEventDestinationRequestBody,
  EventDestination,
  FlowOperationType,
  ListPlatformEventDestinationsRequestBody,
  PopulatedFlow,
  ProjectType,
  SampleDataFileType,
  Template,
  TestPlatformEventDestinationRequestBody,
  TestPlatformEventDestinationResponse,
  UpdatePlatformEventDestinationRequestBody,
} from '@activepieces/shared';
import { queryCollectionOptions } from '@tanstack/query-db-collection';
import { createCollection, useLiveQuery } from '@tanstack/react-db';
import { QueryClient, QueryState, useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { useEffect, useState, useSyncExternalStore } from 'react';

import { flowHooks, flowsApi, triggerEventsApi } from '@/features/flows';
import { projectCollectionUtils } from '@/features/projects';
import { userHooks } from '@/hooks/user-hooks';
import { api } from '@/lib/api';

const collectionQueryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const DESTINATIONS_PAGE_SIZE = 100;

const DESTINATIONS_QUERY_KEY = ['event-destinations'];

export const eventDestinationsCollection = createCollection<
  EventDestination,
  string
>(
  queryCollectionOptions({
    queryKey: DESTINATIONS_QUERY_KEY,
    queryClient: collectionQueryClient,
    queryFn: () => fetchAllDestinations(),
    getKey: (item) => item.id,
    onUpdate: async ({ transaction }) => {
      for (const { original, changes } of transaction.mutations) {
        await api.post<EventDestination>(
          `/v1/event-destinations/${original.id}`,
          toUpdateRequestBody(changes),
        );
      }
    },
    onDelete: async ({ transaction }) => {
      for (const { original } of transaction.mutations) {
        await api.delete<void>(`/v1/event-destinations/${original.id}`);
      }
    },
  }),
);

export const eventDestinationsCollectionUtils = {
  useAll: (enabled: boolean): LiveDestinations => useLiveDestinations(enabled),

  useFreshDestination: (destinationId: string): FreshDestination => {
    const { data: destinations } = useLiveDestinations(true);
    const queryState = useSyncExternalStore(
      subscribeToDestinationsQuery,
      readDestinationsQueryState,
    );
    const [countsAtOpen] = useState(() => ({
      data: queryState?.dataUpdateCount ?? 0,
      error: queryState?.errorUpdateCount ?? 0,
    }));
    useEffect(() => {
      eventDestinationsCollection.utils.refetch().catch(() => undefined);
    }, []);
    const dataUpdateCount = queryState?.dataUpdateCount ?? 0;
    if (dataUpdateCount <= countsAtOpen.data) {
      const hasFreshError =
        queryState?.status === 'error' &&
        queryState.errorUpdateCount > countsAtOpen.error;
      return { status: hasFreshError ? 'error' : 'loading' };
    }
    const destination = destinations.find(
      (candidate) => candidate.id === destinationId,
    );
    return isNil(destination)
      ? { status: 'missing' }
      : { status: 'ready', destination };
  },

  refetch: () => eventDestinationsCollection.utils.refetch(),

  useSaveEventDestination: ({
    onSuccess,
    onError,
  }: MutationCallbacks<EventDestination>) => {
    return useMutation({
      mutationFn: ({ destinationId, request }: SaveEventDestinationParams) =>
        api.post<EventDestination>(
          isNil(destinationId)
            ? '/v1/event-destinations'
            : `/v1/event-destinations/${destinationId}`,
          request,
        ),
      onSuccess: async (data) => {
        await applySavedDestination(data).catch(() => undefined);
        onSuccess(data);
      },
      onError,
    });
  },

  update: ({ destinationId, request }: UpdateEventDestinationParams) =>
    eventDestinationsCollection.update(destinationId, (draft) => {
      Object.assign(
        draft,
        Object.fromEntries(
          Object.entries(request).filter(([_, value]) => value !== undefined),
        ),
      );
    }),

  delete: async (destinationIds: string[]) => {
    const transaction = eventDestinationsCollection.delete(destinationIds);
    await transaction.isPersisted.promise;
  },

  useTestEventDestination: () => {
    return useMutation({
      mutationFn: (request: TestPlatformEventDestinationRequestBody) =>
        api.post<TestPlatformEventDestinationResponse>(
          `/v1/event-destinations/test`,
          request,
        ),
      onError: () => undefined,
    });
  },

  useImportHandlerFlow: ({
    onSuccess,
    onError,
  }: MutationCallbacks<PopulatedFlow>) => {
    const { data: currentUser } = userHooks.useCurrentUser();
    const { data: allProjects } = projectCollectionUtils.useAll();

    return useMutation<PopulatedFlow, Error, ImportHandlerFlowParams>({
      mutationFn: async ({ template, selectedEvents }) => {
        const personalProject = allProjects.find(
          (project) =>
            project.type === ProjectType.PERSONAL &&
            project.ownerId === currentUser?.id,
        );
        if (!personalProject) {
          throw new Error(
            t('You need a personal project to generate the handler flow.'),
          );
        }

        projectCollectionUtils.setCurrentProject(personalProject.id);
        const flows = await flowHooks.importFlowsFromTemplates({
          templates: [template],
          projectId: personalProject.id,
        });
        const createdFlow = flows[0];
        if (!createdFlow) {
          throw new Error(t('Flow import returned no flow.'));
        }

        const triggerStepName = createdFlow.version.trigger.name;
        const triggerPayloads = selectedEvents.map((eventName) =>
          buildWebhookTriggerPayload(
            buildMockEvent({
              event: eventName,
              platformId: personalProject.platformId,
              projectId: personalProject.id,
            }),
          ),
        );

        for (const triggerPayload of triggerPayloads) {
          await triggerEventsApi.saveTriggerMockdata({
            projectId: personalProject.id,
            flowId: createdFlow.id,
            mockData: triggerPayload,
          });
        }
        await flowsApi.update(createdFlow.id, {
          type: FlowOperationType.SAVE_SAMPLE_DATA,
          request: {
            stepName: triggerStepName,
            payload: triggerPayloads[0],
            type: SampleDataFileType.OUTPUT,
          },
        });

        return createdFlow;
      },
      onSuccess,
      onError,
    });
  },
};

async function applySavedDestination(
  destination: EventDestination,
): Promise<void> {
  await eventDestinationsCollection.preload();
  if (readHasLoadFailed()) {
    await eventDestinationsCollection.utils.refetch();
    return;
  }
  eventDestinationsCollection.utils.writeUpsert(destination);
}

function useLiveDestinations(enabled: boolean): LiveDestinations {
  const { data, isLoading } = useLiveQuery(
    (q) =>
      enabled
        ? q
            .from({ destination: eventDestinationsCollection })
            .select(({ destination }) => ({ ...destination }))
        : undefined,
    [enabled],
  );
  const hasLoadFailed = useSyncExternalStore(
    subscribeToDestinationsQuery,
    readHasLoadFailed,
  );
  useEffect(() => {
    if (!enabled) {
      return;
    }
    collectionQueryClient.mount();
    return () => collectionQueryClient.unmount();
  }, [enabled]);
  if (!enabled) {
    return { data: [], isLoading: false, isError: false };
  }
  return { data: data ?? [], isLoading, isError: hasLoadFailed };
}

function subscribeToDestinationsQuery(onChange: () => void): () => void {
  return collectionQueryClient.getQueryCache().subscribe(onChange);
}

function readDestinationsQueryState():
  | QueryState<EventDestination[]>
  | undefined {
  return collectionQueryClient.getQueryState<EventDestination[]>(
    DESTINATIONS_QUERY_KEY,
  );
}

function readHasLoadFailed(): boolean {
  return (
    collectionQueryClient.getQueryState(DESTINATIONS_QUERY_KEY)?.status ===
    'error'
  );
}

async function fetchAllDestinations(): Promise<EventDestination[]> {
  const destinations: EventDestination[] = [];
  let cursor: string | undefined = undefined;
  do {
    const request: ListPlatformEventDestinationsRequestBody = {
      cursor,
      limit: DESTINATIONS_PAGE_SIZE,
    };
    const page: SeekPage<EventDestination> = await api.get<
      SeekPage<EventDestination>
    >('/v1/event-destinations', request);
    destinations.push(...page.data);
    cursor = page.next ?? undefined;
  } while (!isNil(cursor));
  return destinations;
}

function toUpdateRequestBody(
  changes: Partial<EventDestination>,
): UpdatePlatformEventDestinationRequestBody {
  return {
    url: changes.url,
    events: changes.events,
    enabled: changes.enabled,
    headers: changes.headers,
    format: changes.format,
  };
}

function buildWebhookTriggerPayload(
  event: ApplicationEvent,
): WebhookTriggerPayload {
  return {
    body: event,
    headers: {},
    queryParams: {},
  };
}

export type ImportHandlerFlowParams = {
  template: Template;
  selectedEvents: ApplicationEventName[];
};

type WebhookTriggerPayload = {
  body: ApplicationEvent;
  headers: Record<string, string>;
  queryParams: Record<string, string>;
};

export type LiveDestinations = {
  data: EventDestination[];
  isLoading: boolean;
  isError: boolean;
};

export type FreshDestination =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'missing' }
  | { status: 'ready'; destination: EventDestination };

export type MutationCallbacks<T> = {
  onSuccess: (result: T) => void;
  onError: (error: Error) => void;
};

export type SaveEventDestinationParams = {
  destinationId: string | null;
  request: CreatePlatformEventDestinationRequestBody;
};

export type UpdateEventDestinationParams = {
  destinationId: string;
  request: UpdatePlatformEventDestinationRequestBody;
};
