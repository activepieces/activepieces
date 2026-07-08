import { FlowActionType, PackageType, PieceType } from '@activepieces/shared';
import { describe, expect, it } from 'vitest';

import {
  PieceStepMetadataWithSuggestions,
  PrimitiveStepMetadata,
  StepMetadataWithSuggestions,
} from '@/features/pieces/types';
import { pieceSearchUtils } from '@/features/pieces/utils/piece-search-utils';

const makePiece = ({
  pieceName,
  categories,
}: {
  pieceName: string;
  categories: string[];
}): PieceStepMetadataWithSuggestions => ({
  type: FlowActionType.PIECE,
  pieceName,
  pieceVersion: '1.0.0',
  categories,
  packageType: PackageType.REGISTRY,
  pieceType: PieceType.OFFICIAL,
  auth: undefined,
  displayName: pieceName,
  logoUrl: '',
  description: '',
});

const codeStep: PrimitiveStepMetadata = {
  type: FlowActionType.CODE,
  displayName: 'Code',
  logoUrl: '',
  description: '',
};

const brandedPiece = makePiece({
  pieceName: '@acme/piece-internal',
  categories: ['My Category'],
});
const aiPiece = makePiece({
  pieceName: '@activepieces/piece-openai',
  categories: ['ARTIFICIAL_INTELLIGENCE'],
});
const crmPiece = makePiece({
  pieceName: '@activepieces/piece-hubspot',
  categories: ['SALES_AND_CRM'],
});
const queryResult: StepMetadataWithSuggestions[] = [
  codeStep,
  aiPiece,
  brandedPiece,
  crmPiece,
];

describe('getPrioritizedCategories', () => {
  it('builds one group per configured category, in config order, matching case-insensitively', () => {
    const result = pieceSearchUtils.getPrioritizedCategories({
      queryResult,
      categoryPriority: ['my category', 'artificial_intelligence'],
    });
    expect(result).toEqual([
      { title: 'my category', metadata: [brandedPiece] },
      { title: 'Artificial Intelligence', metadata: [aiPiece] },
    ]);
  });

  it('prettifies known enum categories and keeps custom category strings verbatim', () => {
    const result = pieceSearchUtils.getPrioritizedCategories({
      queryResult,
      categoryPriority: ['SALES_AND_CRM', 'My Category'],
    });
    expect(result.map((category) => category.title)).toEqual([
      'Sales And Crm',
      'My Category',
    ]);
  });

  it('deduplicates config entries that differ only by case', () => {
    const result = pieceSearchUtils.getPrioritizedCategories({
      queryResult,
      categoryPriority: ['My Category', 'my category', 'MY CATEGORY'],
    });
    expect(result).toEqual([
      { title: 'My Category', metadata: [brandedPiece] },
    ]);
  });

  it('drops categories with no matching pieces and returns nothing without config', () => {
    expect(
      pieceSearchUtils.getPrioritizedCategories({
        queryResult,
        categoryPriority: ['does-not-exist'],
      }),
    ).toEqual([]);
    expect(
      pieceSearchUtils.getPrioritizedCategories({
        queryResult,
        categoryPriority: [],
      }),
    ).toEqual([]);
  });
});

describe('excludePrioritizedPieces', () => {
  it('removes prioritized pieces from other groups and drops emptied groups', () => {
    const prioritizedCategories = pieceSearchUtils.getPrioritizedCategories({
      queryResult,
      categoryPriority: ['My Category'],
    });
    const result = pieceSearchUtils.excludePrioritizedPieces({
      categories: [
        { title: 'Popular', metadata: [brandedPiece, aiPiece] },
        { title: 'Highlights', metadata: [brandedPiece] },
      ],
      prioritizedCategories,
    });
    expect(result).toEqual([{ title: 'Popular', metadata: [aiPiece] }]);
  });

  it('returns groups untouched when nothing is prioritized', () => {
    const categories = [{ title: 'Popular', metadata: [] }];
    expect(
      pieceSearchUtils.excludePrioritizedPieces({
        categories,
        prioritizedCategories: [],
      }),
    ).toBe(categories);
  });
});

describe('sortByCategoryPriority', () => {
  it('moves prioritized pieces to the front, keeping relative order within both partitions', () => {
    const result = pieceSearchUtils.sortByCategoryPriority({
      queryResult,
      categoryPriority: ['my category', 'SALES_AND_CRM'],
    });
    expect(result).toEqual([brandedPiece, crmPiece, codeStep, aiPiece]);
  });

  it('returns the input unchanged when no categories are configured', () => {
    const result = pieceSearchUtils.sortByCategoryPriority({
      queryResult,
      categoryPriority: [],
    });
    expect(result).toEqual(queryResult);
  });
});
