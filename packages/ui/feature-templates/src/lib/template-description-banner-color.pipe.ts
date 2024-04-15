import { experimentalColors } from '@activepieces/ui/common';
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'templateDescriptionBannerColor', pure: true })
export class TemplateDescriptionBannerColor implements PipeTransform {
  transform(value: string): string {
    const number = generateNumber(value);
    if (number >= experimentalColors.length) {
      return experimentalColors[0];
    }
    return experimentalColors[number];
  }
}

function hashString(str: string) {
  let hash = 0;
  str.split('').forEach((_, i) => {
    hash += str.charCodeAt(i);
  });
  return hash;
}

function generateNumber(str: string) {
  const hash = hashString(str);
  return (hash % 3) + 1;
}
