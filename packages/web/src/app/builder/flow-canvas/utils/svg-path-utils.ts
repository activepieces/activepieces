import { chunk } from '@activepieces/shared';

const COMMAND_REGEX = /([MmLlHhVvAa])([^MmLlHhVvAa]*)/g;
const NUMBER_REGEX = /-?\d*\.?\d+(?:e[+-]?\d+)?/gi;

function transposeCommand({
  command,
  numbers,
}: {
  command: string;
  numbers: number[];
}): string {
  switch (command) {
    case 'M':
    case 'm':
    case 'L':
    case 'l':
      return chunk(numbers, 2)
        .map(([x, y]) => `${command}${y} ${x}`)
        .join(' ');
    case 'H':
      return `V${numbers.join(' ')}`;
    case 'h':
      return `v${numbers.join(' ')}`;
    case 'V':
      return `H${numbers.join(' ')}`;
    case 'v':
      return `h${numbers.join(' ')}`;
    case 'A':
    case 'a':
      return chunk(numbers, 7)
        .map(
          ([rx, ry, rotation, largeArc, sweep, x, y]) =>
            `${command}${Math.abs(ry)},${Math.abs(
              rx,
            )} ${rotation} ${largeArc},${1 - sweep} ${y},${x}`,
        )
        .join(' ');
    default:
      return `${command}${numbers.join(' ')}`;
  }
}

/**
 * Reflects an SVG path across the y = x axis, turning a path drawn for the
 * vertical canvas layout into its horizontal counterpart.
 */
function transposePath(path: string): string {
  const segments: string[] = [];
  for (const match of path.matchAll(COMMAND_REGEX)) {
    const command = match[1];
    const numbers = (match[2].match(NUMBER_REGEX) ?? []).map(Number);
    segments.push(transposeCommand({ command, numbers }));
  }
  return segments.join(' ');
}

export const svgPathUtils = {
  transposePath,
};
