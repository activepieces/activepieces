import { TriggerStrategy } from "../../flows/triggers/trigger";
import { PiecePropertyMap } from "../property";

export type PieceBase = {
  name: string;
  displayName: string;
  logoUrl: string;
  description: string;
  version: string;
  minimumSupportedRelease?: string;
  maximumSupportedRelease?: string;
}

export type ActionBase = {
  name: string,
  displayName: string,
  description: string,
  sampleData: unknown,
  props: PiecePropertyMap ,
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
