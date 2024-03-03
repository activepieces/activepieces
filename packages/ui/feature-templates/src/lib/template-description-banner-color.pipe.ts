import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'templateDescriptionBannerColor', pure: true })
export class TemplateDescriptionBannerColor implements PipeTransform {
  transform(value: string): string {
    const number = generateNumber(value);
    switch (number) {
      case 0:
        return '#f5dc83';
      case 1:
        return '#ed9090';
      case 2:
        return '#90edb5';
      default:
        return '#90b5ed';
    }
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
