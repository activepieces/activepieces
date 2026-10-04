import { brandColors, StatusColors } from '@activepieces/shared';

let saved: BrandSeed = { primaryColor: brandColors.defaultPrimaryColor() };
let preview: BrandSeed | null = null;

function apply(seed: BrandSeed) {
  saved = seed;
  write(preview ?? saved);
}

function setPreview(seed: BrandSeed) {
  preview = seed;
  write(preview);
}

function clearPreview() {
  preview = null;
  write(saved);
}

function write({ primaryColor, statusColors = {} }: BrandSeed) {
  const { style } = document.documentElement;
  brandColors
    .statusVariableNames()
    .forEach((name) => style.removeProperty(name));
  Object.entries({
    ...brandColors.cssVariables({ primaryColor }),
    ...brandColors.statusCssVariables({ statusColors }),
  }).forEach(([name, value]) => style.setProperty(name, value));
}

export const brandSeed = { apply, setPreview, clearPreview };

type BrandSeed = {
  primaryColor: string;
  statusColors?: StatusColors;
};
