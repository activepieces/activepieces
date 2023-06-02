import { Piece } from '@activepieces/pieces-framework';
import { slack } from '@activepieces/piece-slack';
import { square } from '@activepieces/piece-square';

/**
 * @deprecated this will be removed, don't use it
 */const pieces: Piece[] = [
    slack,
    square
].sort((a, b) => a.displayName > b.displayName ? 1 : -1);

/**
 * @deprecated this will be removed, don't use it
 */
export const getPiece = (name: string): Piece | undefined => {
    return pieces.find((f) => name.toLowerCase() === f.name.toLowerCase());
};
