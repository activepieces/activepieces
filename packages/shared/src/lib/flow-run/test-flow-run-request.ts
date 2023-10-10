import { Static, Type } from '@sinclair/typebox';
import { ApId } from '../common/id-generator';

export const TestFlowRunRequestBody = Type.Object({
  flowVersionId: ApId,
});

export type TestFlowRunRequestBody = Static<typeof TestFlowRunRequestBody>;
