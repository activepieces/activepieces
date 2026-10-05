import { SeekPage } from '@activepieces/core-utils';
import {
  ApplicationEvent,
  ApplicationEventName,
  buildMockEvent,
  CreatePlatformEventDestinationRequestBody,
  EventDestination,
  FlowOperationType,
  PopulatedFlow,
  ProjectType,
  SampleDataFileType,
  Template,
  TestPlatformEventDestinationRequestBody,
  UpdatePlatformEventDestinationRequestBody,
} from '@activepieces/shared';
import { queryCollectionOptions } from '@tanstack/query-db-collection';
import { createCollection, useLiveQuery } from '@tanstack/react-db';
import { QueryClient, useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { toast } from 'sonner';

import { flowHooks, flowsApi, triggerEventsApi } from '@/features/flows';
import { projectCollectionUtils } from '@/features/projects';
import { userHooks } from '@/hooks/user-hooks';
import { api } from '@/lib/api';
import { mutationFeedback } from '@/lib/mutation-feedback';

const collectionQueryClient = new QueryClient();

export const eventDestinationsCollection = createCollection<
  EventDestination,
  string
>(
  queryCollectionOptions({
    queryKey: ['event-destinations'],
    queryClient: collectionQueryClient,
    queryFn: async () => {
      const response = await api.get<SeekPage<EventDestination>>(
        '/v1/event-destinations',
      );
      return response.data;
    },
    getKey: (item) => item.id,
    onUpdate: async ({ transaction }) => {
      for (const { original, modified } of transaction.mutations) {
        const request: UpdatePlatformEventDestinationRequestBody = {
          url: modified.url,
          events: modified.events,
        };
        await api.patch<EventDestination>(
          `/v1/event-destinations/${original.id}`,
          request,
        );
      }
    },
    onInsert: async ({ transaction }) => {
      for (const { modified } of transaction.mutations) {
        const request: CreatePlatformEventDestinationRequestBody = {
          url: modified.url,
          events: modified.events,
        };
        await api.post<EventDestination>('/v1/event-destinations', request);
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
  useAll: (enabled: boolean) => {
    const queryResult = useLiveQuery(
      (q) =>
        q
          .from({ destination: eventDestinationsCollection })
          .select(({ destination }) => ({ ...destination })),
      [],
    );
    const refetch = () => eventDestinationsCollection.utils.refetch();
    if (!enabled) {
      return {
        data: [],
        isLoading: false,
        isError: false,
        isSuccess: true,
        refetch,
      };
    }
    return { ...queryResult, refetch };
  },

  useCreateEventDestination: (
    onSuccess: (destination: EventDestination) => void,
    onError: (error: Error) => void,
  ) => {
    return useMutation({
      mutationFn: createDestination,
      onSuccess: (data) => {
        mutationFeedback.undo({
          message: t('Destination created'),
          onUndo: () => deleteDestination(data.id),
        });
        onSuccess(data);
      },
      onError,
    });
  },

  update: (
    destinationId: string,
    request: UpdatePlatformEventDestinationRequestBody,
  ) => {
    return eventDestinationsCollection.update(destinationId, (draft) => {
      Object.assign(
        draft,
        Object.fromEntries(
          Object.entries(request).filter(([_, value]) => value !== undefined),
        ),
      );
    });
  },

  delete: (destinationIds: string[]) => {
    return eventDestinationsCollection.delete(destinationIds);
  },

  deleteWithUndo: async (destination: EventDestination) => {
    const transaction = eventDestinationsCollection.delete(destination.id);
    try {
      await transaction.isPersisted.promise;
    } catch (error) {
      mutationFeedback.error({
        error,
        title: t("Couldn't delete the destination"),
      });
      return;
    }
    mutationFeedback.undo({
      message: t('Destination deleted'),
      onUndo: () =>
        createDestination({
          url: destination.url,
          events: destination.events,
        }),
    });
  },

  useTestEventDestination: () => {
    return useMutation({
      mutationFn: (request: TestPlatformEventDestinationRequestBody) =>
        api.post<void>(`/v1/event-destinations/test`, request),
      onSuccess: () => {
        toast.success(t('Test event sent'));
      },
      onError: (error) => {
        mutationFeedback.error({
          error,
          title: t("Couldn't send the test event"),
        });
      },
    });
  },

  useImportHandlerFlow: (
    onSuccess: (flow: PopulatedFlow) => void,
    onError: (error: Error) => void,
  ) => {
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

async function createDestination(
  request: CreatePlatformEventDestinationRequestBody,
): Promise<EventDestination> {
  const created = await api.post<EventDestination>(
    '/v1/event-destinations',
    request,
  );
  eventDestinationsCollection.utils.writeInsert(created);
  return created;
}

async function deleteDestination(destinationId: string): Promise<void> {
  await eventDestinationsCollection.delete(destinationId).isPersisted.promise;
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
