import { DropdownOption } from '@activepieces/pieces-framework';

export interface ConnectionDropdownItem {
  label: { pieceName: string | null; name: string };
  value: string;
}

export type PieceConnectionDropdownItem =
  DropdownOption<`{{connections['${string}']}}`>;
