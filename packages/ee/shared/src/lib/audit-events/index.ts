import { Static, Type } from '@sinclair/typebox';
import {
  AppConnectionWithoutSensitiveData,
  BaseModelSchema,
  Flow,
  FlowOperationRequest,
  FlowOperationType,
  FlowRun,
  FlowVersion,
  Folder,
  Project,
  User,
} from '@activepieces/shared';
import { SigningKey } from '../signing-key';
export const ListAuditEventsRequest = Type.Object({
  limit: Type.Optional(Type.Number()),
  cursor: Type.Optional(Type.String()),
  action: Type.Optional(Type.String()),
  projectId: Type.Optional(Type.String()),
  userId: Type.Optional(Type.String()),
});

export type ListAuditEventsRequest = Static<typeof ListAuditEventsRequest>;

const UserMeta = Type.Pick(User, ['email', 'id', 'firstName', 'lastName']);

export enum ApplicationEventName {
  FLOW_CREATED = 'flow.created',
  FLOW_DELETED = 'flow.deleted',
  FLOW_UPDATED = 'flow.updated',
  FLOW_RUN_STARTED = 'flow.run.started',
  FLOW_RUN_FINISHED = 'flow.run.finished',
  FOLDER_CREATED = 'folder.created',
  FOLDER_UPDATED = 'folder.updated',
  FOLDER_DELETED = 'folder.deleted',
  CONNECTION_UPSERTED = 'connection.upserted',
  CONNECTION_DELETED = 'connection.deleted',
  USER_SIGNED_UP = 'user.signed.up',
  USER_SIGNED_IN = 'user.signed.in',
  USER_PASSWORD_RESET = 'user.password.reset',
  USER_EMAIL_VERIFIED = 'user.email.verified',
  SIGNING_KEY_CREATED = 'signing.key.created',
}

const BaseAuditEventProps = {
  ...BaseModelSchema,
  platformId: Type.String(),
  projectId: Type.Optional(Type.String()),
  projectDisplayName: Type.Optional(Type.String()),
  userId: Type.Optional(Type.String()),
  userEmail: Type.Optional(Type.String()),
  ip: Type.Optional(Type.String()),
};

export const ConnectionEvent = Type.Object({
  ...BaseAuditEventProps,
  action: Type.Union([
    Type.Literal(ApplicationEventName.CONNECTION_DELETED),
    Type.Literal(ApplicationEventName.CONNECTION_UPSERTED),
  ]),
  data: Type.Object({
    connection: Type.Pick(AppConnectionWithoutSensitiveData, [
      'displayName',
      'externalId',
      'pieceName',
      'status',
      'type',
      'id',
      'created',
      'updated',
    ]),
    project: Type.Optional(Type.Pick(Project, ['displayName'])),
  }),
});
export type ConnectionEvent = Static<typeof ConnectionEvent>;

export const FolderEvent = Type.Object({
  ...BaseAuditEventProps,
  action: Type.Union([
    Type.Literal(ApplicationEventName.FOLDER_UPDATED),
    Type.Literal(ApplicationEventName.FOLDER_CREATED),
    Type.Literal(ApplicationEventName.FOLDER_DELETED),
  ]),
  data: Type.Object({
    folder: Type.Pick(Folder, ['id', 'displayName', 'created', 'updated']),
    project: Type.Optional(Type.Pick(Project, ['displayName'])),
  }),
});

export type FolderEvent = Static<typeof FolderEvent>;

export const FlowRunEvent = Type.Object({
  ...BaseAuditEventProps,
  action: Type.Union([
    Type.Literal(ApplicationEventName.FLOW_RUN_STARTED),
    Type.Literal(ApplicationEventName.FLOW_RUN_FINISHED),
  ]),
  data: Type.Object({
    flowRun: Type.Pick(FlowRun, [
      'id',
      'startTime',
      'finishTime',
      'duration',
      'environment',
      'flowId',
      'flowVersionId',
      'flowDisplayName',
      'status',
    ]),
    project: Type.Optional(Type.Pick(Project, ['displayName'])),
  }),
});
export type FlowRunEvent = Static<typeof FlowRunEvent>;

export const FlowCreatedEvent = Type.Object({
  ...BaseAuditEventProps,
  action: Type.Literal(ApplicationEventName.FLOW_CREATED),
  data: Type.Object({
    flow: Type.Pick(Flow, ['id', 'created', 'updated']),
    project: Type.Optional(Type.Pick(Project, ['displayName'])),
  }),
});

export type FlowCreatedEvent = Static<typeof FlowCreatedEvent>;

export const FlowDeletedEvent = Type.Object({
  ...BaseAuditEventProps,
  action: Type.Literal(ApplicationEventName.FLOW_DELETED),
  data: Type.Object({
    flow: Type.Pick(Flow, ['id', 'created', 'updated']),
    flowVersion: Type.Pick(FlowVersion, [
      'id',
      'displayName',
      'flowId',
      'created',
      'updated',
    ]),
    project: Type.Optional(Type.Pick(Project, ['displayName'])),
  }),
});

export type FlowDeletedEvent = Static<typeof FlowDeletedEvent>;

export const FlowUpdatedEvent = Type.Object({
  ...BaseAuditEventProps,
  action: Type.Literal(ApplicationEventName.FLOW_UPDATED),
  data: Type.Object({
    flowVersion: Type.Pick(FlowVersion, [
      'id',
      'displayName',
      'flowId',
      'created',
      'updated',
    ]),
    request: FlowOperationRequest,
    project: Type.Optional(Type.Pick(Project, ['displayName'])),
  }),
});

export type FlowUpdatedEvent = Static<typeof FlowUpdatedEvent>;

export const AuthenticationEvent = Type.Object({
  ...BaseAuditEventProps,
  action: Type.Union([
    Type.Literal(ApplicationEventName.USER_SIGNED_IN),
    Type.Literal(ApplicationEventName.USER_PASSWORD_RESET),
    Type.Literal(ApplicationEventName.USER_EMAIL_VERIFIED),
  ]),
  data: Type.Object({
    user: Type.Optional(UserMeta),
  }),
});

export type AuthenticationEvent = Static<typeof AuthenticationEvent>;

export const SignUpEvent = Type.Object({
  ...BaseAuditEventProps,
  action: Type.Literal(ApplicationEventName.USER_SIGNED_UP),
  data: Type.Object({
    source: Type.Union([
      Type.Literal('credentials'),
      Type.Literal('sso'),
      Type.Literal('managed'),
    ]),
    user: Type.Optional(UserMeta),
  }),
});
export type SignUpEvent = Static<typeof SignUpEvent>;

export const SigningKeyEvent = Type.Object({
  ...BaseAuditEventProps,
  action: Type.Union([Type.Literal(ApplicationEventName.SIGNING_KEY_CREATED)]),
  data: Type.Object({
    signingKey: Type.Pick(SigningKey, [
      'id',
      'created',
      'updated',
      'displayName',
    ]),
  }),
});

export type SigningKeyEvent = Static<typeof SigningKeyEvent>;

export const ApplicationEvent = Type.Union([
  ConnectionEvent,
  FlowCreatedEvent,
  FlowDeletedEvent,
  FlowUpdatedEvent,
  FlowRunEvent,
  AuthenticationEvent,
  FolderEvent,
  SignUpEvent,
  SigningKeyEvent,
]);

export type ApplicationEvent = Static<typeof ApplicationEvent>;

export function summarizeApplicationEvent(event: ApplicationEvent) {
  switch (event.action) {
    case ApplicationEventName.FLOW_UPDATED: {
      return convertUpdateActionToDetails(event);
    }
    case ApplicationEventName.FLOW_RUN_STARTED:
    case ApplicationEventName.FLOW_RUN_FINISHED: {
      return `Flow run ${event.data.flowRun.id} is finished`;
    }
    case ApplicationEventName.FLOW_CREATED:
      return `Flow ${event.data.flow.id} is created`;
    case ApplicationEventName.FLOW_DELETED:
      return `Flow ${event.data.flow.id} (${event.data.flowVersion.displayName}) is deleted`;
    case ApplicationEventName.FOLDER_CREATED:
      return `${event.data.folder.displayName} is created`;
    case ApplicationEventName.FOLDER_UPDATED:
      return `${event.data.folder.displayName} is updated`;
    case ApplicationEventName.FOLDER_DELETED:
      return `${event.data.folder.displayName} is deleted`;
    case ApplicationEventName.CONNECTION_UPSERTED:
      return `${event.data.connection.displayName} (${event.data.connection.externalId}) is updated`;
    case ApplicationEventName.CONNECTION_DELETED:
      return `${event.data.connection.displayName} (${event.data.connection.externalId}) is deleted`;
    case ApplicationEventName.USER_SIGNED_IN:
      return `User ${event.userEmail} signed in`;
    case ApplicationEventName.USER_PASSWORD_RESET:
      return `User ${event.userEmail} reset password`;
    case ApplicationEventName.USER_EMAIL_VERIFIED:
      return `User ${event.userEmail} verified email`;
    case ApplicationEventName.USER_SIGNED_UP:
      return `User ${event.data.user?.email} signed up using email from ${event.data.source}`;
    case ApplicationEventName.SIGNING_KEY_CREATED:
      return `${event.data.signingKey.displayName} is created`;
  }
}

function convertUpdateActionToDetails(event: FlowUpdatedEvent) {
  switch (event.data.request.type) {
    case FlowOperationType.ADD_ACTION:
      return `Added action "${event.data.request.request.action.displayName}" to "${event.data.flowVersion.displayName}" Flow.`;
    case FlowOperationType.UPDATE_ACTION:
      return `Updated action "${event.data.request.request.displayName}" in "${event.data.flowVersion.displayName}" Flow.`;
    case FlowOperationType.DELETE_ACTION:
      return `Deleted action "${event.data.request.request.name}" from "${event.data.flowVersion.displayName}" Flow.`;
    case FlowOperationType.CHANGE_NAME:
      return `Renamed flow "${event.data.flowVersion.displayName}" to "${event.data.request.request.displayName}".`;
    case FlowOperationType.LOCK_AND_PUBLISH:
      return `Locked and published flow "${event.data.flowVersion.displayName}" Flow.`;
    case FlowOperationType.USE_AS_DRAFT:
      return `Unlocked and unpublished flow "${event.data.flowVersion.displayName}" Flow.`;
    case FlowOperationType.MOVE_ACTION:
      return `Moved action "${event.data.request.request.name}" to after "${event.data.request.request.newParentStep}".`;
    case FlowOperationType.LOCK_FLOW:
      return `Locked flow "${event.data.flowVersion.displayName}" Flow.`;
    case FlowOperationType.CHANGE_STATUS:
      return `Changed status of flow "${event.data.flowVersion.displayName}" Flow to "${event.data.request.request.status}".`;
    case FlowOperationType.DUPLICATE_ACTION:
      return `Duplicated action "${event.data.request.request.stepName}" in "${event.data.flowVersion.displayName}" Flow.`;
    case FlowOperationType.IMPORT_FLOW:
      return `Imported flow in "${event.data.request.request.displayName}" Flow.`;
    case FlowOperationType.UPDATE_TRIGGER:
      return `Updated trigger in "${event.data.flowVersion.displayName}" Flow to "${event.data.request.request.displayName}".`;
    case FlowOperationType.CHANGE_FOLDER:
      return `Moved flow "${event.data.flowVersion.displayName}" to folder id ${event.data.request.request.folderId}.`;
    case FlowOperationType.DELETE_BRANCH: {
      return `Deleted branch number ${
        event.data.request.request.branchIndex + 1
      } in flow "${event.data.flowVersion.displayName}" for the step "${
        event.data.request.request.stepName
      }".`;
    }
    case FlowOperationType.DUPLICATE_BRANCH: {
      return `Duplicated branch number ${
        event.data.request.request.branchIndex + 1
      } in flow "${event.data.flowVersion.displayName}" for the step "${
        event.data.request.request.stepName
      }".`;
    }
    case FlowOperationType.ADD_BRANCH:
      return `Added branch number ${
        event.data.request.request.branchIndex + 1
      } in flow "${event.data.flowVersion.displayName}" for the step "${
        event.data.request.request.stepName
      }".`;
  }
}
