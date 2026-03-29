import { Piece } from '@activepieces/pieces-framework';
import { pcloud } from './pcloud';
import { gmailMcp } from './gmail-mcp';
import { canvaMcp } from './canva-mcp';

export const pieces: Piece[] = [
  pcloud,
  gmailMcp,
  canvaMcp,
];
