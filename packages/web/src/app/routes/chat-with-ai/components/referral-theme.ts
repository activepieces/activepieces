// One per-phrase color identity shared by the referral share card AND the celebration show, so a
// phrase looks the same wherever it appears. Soft, warm, low-chroma — creamy backgrounds, dusty
// accents (never saturated Tailwind primaries), warm same-hue inks; one candlelit dark option.
const REFERRAL_CARD_COLORS: ReferralColor[] = [
  {
    id: 'linen',
    name: 'Linen',
    bg: '#F6EFE2',
    fg: '#453A2D',
    accent: '#9C6B44',
  },
  {
    id: 'peach',
    name: 'Peach',
    bg: '#F8E5D5',
    fg: '#4E382A',
    accent: '#C0714A',
  },
  { id: 'rose', name: 'Rose', bg: '#F4E1E1', fg: '#4A3134', accent: '#B26A72' },
  {
    id: 'lilac',
    name: 'Lilac',
    bg: '#EBE4F3',
    fg: '#3D3552',
    accent: '#8672B5',
  },
  { id: 'mist', name: 'Mist', bg: '#E3EBF1', fg: '#32404C', accent: '#6285A4' },
  { id: 'sage', name: 'Sage', bg: '#E6ECE0', fg: '#384435', accent: '#6E8B67' },
  {
    id: 'charcoal',
    name: 'Charcoal',
    bg: '#2B2725',
    fg: '#EDE5DA',
    accent: '#D2A56F',
  },
];

// Deterministic: the same phrase always maps to the same color, no storage needed.
function phraseColorIndex(phrase: string): number {
  let hash = 0;
  for (let i = 0; i < phrase.length; i++) {
    hash = (hash * 31 + phrase.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % REFERRAL_CARD_COLORS.length;
}

function colorForPhrase(phrase: string): ReferralColor {
  return REFERRAL_CARD_COLORS[phraseColorIndex(phrase)];
}

export { REFERRAL_CARD_COLORS, phraseColorIndex, colorForPhrase };

export type ReferralColor = {
  id: string;
  name: string;
  bg: string;
  fg: string;
  accent: string;
};
