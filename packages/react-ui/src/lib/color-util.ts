const hexToHslString = (hex: string) => {
  const { hue, saturation, lightness } = parseToHsl(hex);
  return `${hue.toFixed(1)} ${(saturation * 100).toFixed(1)}% ${(
    lightness * 100
  ).toFixed(1)}%`;
};

const parseToHsl = (hex: string) => {
  // Remove the '#' character if it exists
  hex = hex.replace(/^#/, '');

  // Convert 3-digit hex to 6-digit hex
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((char) => char + char)
      .join('');
  }

  // Convert hex to RGB
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  // Find the maximum and minimum values to get lightness
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);

  // Calculate lightness
  const lightness = (max + min) / 2;

  let hue = 0;
  let saturation = 0;

  if (max !== min) {
    const delta = max - min;

    // Calculate saturation
    saturation =
      lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);

    // Calculate hue
    switch (max) {
      case r:
        hue = (g - b) / delta + (g < b ? 6 : 0);
        break;
      case g:
        hue = (b - r) / delta + 2;
        break;
      case b:
        hue = (r - g) / delta + 4;
        break;
    }

    hue /= 6;
  }

  // Convert hue to degrees
  hue = hue * 360;

  return {
    hue,
    saturation,
    lightness,
  };
};

export const colorsUtils = {
  hexToHslString,
  parseToHsl,
};
