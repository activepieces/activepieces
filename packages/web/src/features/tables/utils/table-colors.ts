import { TableColor } from '@activepieces/shared';

// Maps a palette key to a hand-written CSS class in `revogrid.css` (`.ap-tint-<key>`).
// The grid sets cell backgrounds with high-specificity `!important` rules, so a bare
// Tailwind utility on the cell would lose; the CSS class wins and carries dark-mode.
const cellClass: Record<TableColor, string> = {
  [TableColor.GRAY]: 'ap-tint-gray',
  [TableColor.RED]: 'ap-tint-red',
  [TableColor.ORANGE]: 'ap-tint-orange',
  [TableColor.AMBER]: 'ap-tint-amber',
  [TableColor.GREEN]: 'ap-tint-green',
  [TableColor.TEAL]: 'ap-tint-teal',
  [TableColor.BLUE]: 'ap-tint-blue',
  [TableColor.INDIGO]: 'ap-tint-indigo',
  [TableColor.PURPLE]: 'ap-tint-purple',
  [TableColor.PINK]: 'ap-tint-pink',
};

// Literal Tailwind strings for the picker's swatch dots (rendered in normal DOM, so
// utilities apply directly). Literal — never interpolated — so the JIT emits them.
const swatchClass: Record<TableColor, string> = {
  [TableColor.GRAY]: 'bg-neutral-400',
  [TableColor.RED]: 'bg-red-500',
  [TableColor.ORANGE]: 'bg-orange-500',
  [TableColor.AMBER]: 'bg-amber-500',
  [TableColor.GREEN]: 'bg-green-500',
  [TableColor.TEAL]: 'bg-teal-500',
  [TableColor.BLUE]: 'bg-blue-500',
  [TableColor.INDIGO]: 'bg-indigo-500',
  [TableColor.PURPLE]: 'bg-purple-500',
  [TableColor.PINK]: 'bg-pink-500',
};

// i18n keys (present in en/translation.json) for swatch labels/tooltips.
const label: Record<TableColor, string> = {
  [TableColor.GRAY]: 'Gray',
  [TableColor.RED]: 'Red',
  [TableColor.ORANGE]: 'Orange',
  [TableColor.AMBER]: 'Amber',
  [TableColor.GREEN]: 'Green',
  [TableColor.TEAL]: 'Teal',
  [TableColor.BLUE]: 'Blue',
  [TableColor.INDIGO]: 'Indigo',
  [TableColor.PURPLE]: 'Purple',
  [TableColor.PINK]: 'Pink',
};

const order: TableColor[] = [
  TableColor.RED,
  TableColor.ORANGE,
  TableColor.AMBER,
  TableColor.GREEN,
  TableColor.TEAL,
  TableColor.BLUE,
  TableColor.INDIGO,
  TableColor.PURPLE,
  TableColor.PINK,
  TableColor.GRAY,
];

export const tableColors = { cellClass, swatchClass, label, order };
