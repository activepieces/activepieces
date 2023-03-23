export const semVerRegex = /^[0-9]+\.[0-9]+\.[0-9]+$/;

const parseSemVer = (semVer: string): [number, number, number] => {
  if(!semVerRegex.test(semVer)) {
    throw new Error(`"semVer" should match ${semVerRegex.source}`);
  }

  const parsedSemVer = semVer.split('.').map(p => Number.parseInt(p, 10));
  return parsedSemVer as [number, number, number];
};

export const compareSemVer = (left: string, right: string): number => {
  if(!semVerRegex.test(left) || !semVerRegex.test(right)) {
    throw new Error(`"left" and "right" should match ${semVerRegex.source}`);
  }

  const leftParsed = parseSemVer(left);
  const rightParsed = parseSemVer(right);

  for (let i = 0; i < 3; i++) {
    const leftPart = leftParsed[i];
    const rightPart = rightParsed[i];

    if (leftPart < rightPart) {
      return -1;
    }
    else if (leftPart > rightPart) {
      return 1;
    }
    else {
      continue;
    }
  }

  return 0;
}
