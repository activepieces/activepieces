import { MultipartFile } from "@activepieces/shared";
import { PiecePropertyMap } from "./property";
import { TriggerStrategy } from "./trigger/trigger";

import { Static, Type } from "@sinclair/typebox";

export enum PieceType {
  PRIVATE = "PRIVATE",
  PUBLIC = "PUBLIC",
}

const PieceBaseProps = {
  name: Type.String(),
  displayName: Type.String(),
  logoUrl: Type.String(),
  projectId: Type.Optional(Type.String()),
  description: Type.String(),
  version: Type.String(),
  tarFileId: Type.Optional(Type.String()),
  minimumSupportedRelease: Type.Optional(Type.String()),
  maximumSupportedRelease: Type.Optional(Type.String()),
};

export const PieceBase = Type.Object(PieceBaseProps);

export type PieceBase = Static<typeof PieceBase>;


const ActionBaseProps = {
  name: Type.String(),
  displayName: Type.String(),
  description: Type.String(),
  sampleData: Type.Unknown(),
  // TODO RMEOVE
  props: Type.Any(),
};

export const ActionBase = Type.Object(ActionBaseProps)

export type ActionBase = Static<typeof ActionBase> & { props: PiecePropertyMap };

export const TriggerBase = Type.Object({
  ...ActionBaseProps,
  type: Type.Enum(TriggerStrategy),
})

export type TriggerBase = Static<typeof TriggerBase> & { props: PiecePropertyMap };

export const PieceMetadata = Type.Object({
  ...PieceBaseProps,
  type: Type.Optional(Type.Enum(PieceType)),
  actions: Type.Record(Type.String(), ActionBase),
  triggers: Type.Record(Type.String(), TriggerBase),
});

export type PieceMetadata = Static<typeof PieceMetadata>;

export const PieceMetadataSummary = Type.Object({
  ...PieceBaseProps,
  type: Type.Optional(Type.Enum(PieceType)),
  actions: Type.Number(),
  triggers:  Type.Number(),
});

export type PieceMetadataSummary = Static<typeof PieceMetadataSummary>;

export const PublishPieceRequest = Type.Object({
  metadata: Type.String(),
  tarFile: Type.Array(MultipartFile),
});

export type PublishPieceRequest = Static<typeof PublishPieceRequest>;