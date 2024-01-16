import { ProjectId } from "@activepieces/shared";
import { PieceAuthProperty, PiecePropertyMap } from "./property";
import { TriggerStrategy, WebhookHandshakeConfiguration } from "./trigger/trigger";
import { ErrorHandlingOptionsParam } from "./action/action";

export type PieceBase = {
  id?: string;
  name: string;
  displayName: string;
  logoUrl: string;
  description: string;
  projectId?: ProjectId;
  platformId?: string;
  directoryName?: string;
  auth?: PieceAuthProperty;
  version: string;
  minimumSupportedRelease?: string;
  maximumSupportedRelease?: string;
}

export type ActionBase = {
  name: string,
  displayName: string,
  description: string,
  props: PiecePropertyMap,
  requireAuth: boolean;
  errorHandlingOptions?: ErrorHandlingOptionsParam;
}

export type TriggerBase = Omit<ActionBase,"requireAuth"> & {
  type: TriggerStrategy;
  sampleData: unknown,
  handshakeConfiguration?: WebhookHandshakeConfiguration;
};

export type PieceMetadata = PieceBase & {
  actions: Record<string, ActionBase >;
  triggers: Record<string, TriggerBase> ;
};

export type PieceMetadataSummary = Omit<PieceMetadata, "actions" | "triggers"> & {
  actions: number;
  triggers: number;
}
