import { PiecePropertyMap } from "./property";
import { TriggerStrategy } from "./trigger/trigger";

export type PieceBase = {
  name: string;
  displayName: string;
  logoUrl: string;
  description: string;
  directoryName?: string;
  version: string;
  minimumSupportedRelease?: string;
  maximumSupportedRelease?: string;
}

export type ActionBase = {
  name: string,
  displayName: string,
  description: string,
  sampleData: unknown,
  props: PiecePropertyMap,
}

export type TriggerBase = ActionBase & {
  type: TriggerStrategy;
};

export type PieceMetadata = PieceBase & {
  actions: Record<string, ActionBase >;
  triggers: Record<string, TriggerBase> ;
};

export type PieceMetadataSummary = Omit<PieceMetadata, "actions" | "triggers"> & {
  actions: number;
  triggers: number;
}
