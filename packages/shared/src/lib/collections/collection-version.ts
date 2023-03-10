import { BaseModel, BaseModelSchema } from '../common/base-model';
import { CollectionId } from './collection';
import { Type } from '@sinclair/typebox';

export type CollectionVersionId = string;

export interface CollectionVersion extends BaseModel<CollectionVersionId> {
  displayName: string;
  collectionId: CollectionId;
  state: CollectionVersionState;
}

export enum CollectionVersionState {
  LOCKED = 'LOCKED',
  DRAFT = 'DRAFT',
}

export const CollectionVersion = Type.Object({
  ...BaseModelSchema,
  displayName: Type.String(),
  collectionId: Type.String(),
  state: Type.Enum(CollectionVersionState),
});
