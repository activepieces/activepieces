import { brandColors } from '@activepieces/shared';

function apply({ primaryColor }: { primaryColor: string }) {
  Object.entries(brandColors.cssVariables({ primaryColor })).forEach(
    ([name, value]) => {
      document.documentElement.style.setProperty(name, value);
    },
  );
}

export const brandSeed = { apply };
