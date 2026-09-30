import { brandColors, StatusColors } from '@activepieces/shared';

function apply({
  primaryColor,
  statusColors = {},
}: {
  primaryColor: string;
  statusColors?: StatusColors;
}) {
  const { style } = document.documentElement;
  brandColors
    .statusVariableNames()
    .forEach((name) => style.removeProperty(name));
  Object.entries({
    ...brandColors.cssVariables({ primaryColor }),
    ...brandColors.statusCssVariables({ statusColors }),
  }).forEach(([name, value]) => style.setProperty(name, value));
}

export const brandSeed = { apply };
