import { Static, Type } from '@sinclair/typebox';

export const CreateFlowRunRequest = Type.Object({
  flowVersionId: Type.String(),
  payload: Type.Any(),
  collectionId: Type.String(),
});

export type CreateFlowRunRequest = Static<typeof CreateFlowRunRequest>;
