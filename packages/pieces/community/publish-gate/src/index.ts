import {
  createPiece,
  PieceAuth,
  PieceCategory,
} from '@activepieces/pieces-framework';
import { continueIfPublished } from './lib/actions/continue-if-published';

export const publishGate = createPiece({
  displayName: 'Publish Gate',
  description:
    'Stops an automation before its next steps unless it has been published, so test runs never trigger your real actions.',
  minimumSupportedRelease: '0.86.0',
  logoUrl:
    'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjNmIzZmEwIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTEyIDIyczgtNCA4LTEwVjVsLTgtMy04IDN2N2MwIDYgOCAxMCA4IDEweiIvPjxwYXRoIGQ9Im05IDEyIDIgMiA0LTQiLz48L3N2Zz4=',
  categories: [PieceCategory.CORE, PieceCategory.FLOW_CONTROL],
  authors: ['Devansh-hello'],
  auth: PieceAuth.None(),
  actions: [continueIfPublished],
  triggers: [],
});
