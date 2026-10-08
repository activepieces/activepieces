import { t } from 'i18next';

function get(): PieceSetTerms {
  return {
    title: t('pieceSetTerm.title'),
    titleSingular: t('pieceSetTerm.titleSingular'),
    term: t('pieceSetTerm.singular'),
    terms: t('pieceSetTerm.plural'),
    Term: t('pieceSetTerm.singularCapitalized'),
    Terms: t('pieceSetTerm.pluralCapitalized'),
  };
}

export const pieceSetTerms = { get };

export type PieceSetTerms = {
  title: string;
  titleSingular: string;
  term: string;
  terms: string;
  Term: string;
  Terms: string;
};
