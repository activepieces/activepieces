import { unique } from '@activepieces/core-utils';
import { PieceSelectionMode, PieceSet } from '@activepieces/shared';
import { t } from 'i18next';

function describe(pieceSet: PieceSet): string {
  const { config } = pieceSet;
  const exceptions = config.pieces.exceptions.length;
  const visibility =
    config.pieces.mode === PieceSelectionMode.INCLUDE_ALL
      ? exceptions === 0
        ? t('All pieces shown')
        : t('{count, plural, =1 {1 piece hidden} other {# pieces hidden}}', {
            count: exceptions,
          })
      : t(
          '{count, plural, =0 {No pieces shown} =1 {Only 1 piece shown} other {Only # pieces shown}}',
          { count: exceptions },
        );
  const limited = unique([
    ...Object.keys(config.selectedActions),
    ...Object.keys(config.selectedTriggers),
  ]).length;
  const required = Object.values(config.requiredActions.actions).flat().length;
  return [
    visibility,
    limited > 0
      ? t('{count, plural, =1 {1 limited} other {# limited}}', {
          count: limited,
        })
      : null,
    required > 0
      ? t(
          '{count, plural, =1 {1 required action} other {# required actions}}',
          { count: required },
        )
      : null,
  ]
    .filter((part) => part !== null)
    .join(' · ');
}

function newPiecesStance(pieceSet: PieceSet): string {
  return showsNewPieces(pieceSet)
    ? t('New pieces shown automatically')
    : t('New pieces hidden until you show them');
}

function showsNewPieces(pieceSet: PieceSet): boolean {
  return pieceSet.config.pieces.mode === PieceSelectionMode.INCLUDE_ALL;
}

export const pieceSetSummary = { describe, newPiecesStance, showsNewPieces };
