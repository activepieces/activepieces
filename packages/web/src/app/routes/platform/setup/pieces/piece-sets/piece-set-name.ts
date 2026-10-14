function short(name: string): string {
  const characters = Array.from(name);
  if (characters.length <= MAX_LENGTH) {
    return name;
  }
  return `${characters.slice(0, MAX_LENGTH).join('')}…`;
}

const MAX_LENGTH = 60;

export const pieceSetName = { short };
