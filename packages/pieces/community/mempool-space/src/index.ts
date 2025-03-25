import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';

// General Actions
import { getDifficultyAdjustment } from './lib/actions/general/get-difficulty-adjustment';
import { getPrice } from './lib/actions/general/get-price';
import { getHistoricalPrice } from './lib/actions/general/get-historical-price';

// Address Actions
import { getAddressDetails } from './lib/actions/addresses/get-address-details';
import { getAddressTransactions } from './lib/actions/addresses/get-address-transactions';
import { getAddressTransactionsChain } from './lib/actions/addresses/get-address-transactions-chain';
import { getAddressTransactionsMempool } from './lib/actions/addresses/get-address-transactions-mempool';
import { getAddressUtxo } from './lib/actions/addresses/get-address-utxo';
import { validateAddress } from './lib/actions/addresses/validate-address';

// Fees Actions
import { getMempoolBlocksFees } from './lib/actions/fees/get-mempool-blocks-fees';
import { getRecommendedFees } from './lib/actions/fees/get-recommended-fees';

// Block Actions
import { getBlock } from './lib/actions/blocks/get-block';
import { getBlockHeader } from './lib/actions/blocks/get-block-header';
import { getBlockHeight } from './lib/actions/blocks/get-block-height';
import { getBlockTimestamp } from './lib/actions/blocks/get-block-timestamp';
import { getBlockRaw } from './lib/actions/blocks/get-block-raw';
import { getBlockStatus } from './lib/actions/blocks/get-block-status';
import { getBlockTipHeight } from './lib/actions/blocks/get-block-tip-height';
import { getBlockTipHash } from './lib/actions/blocks/get-block-tip-hash';
import { getBlockTransactionId } from './lib/actions/blocks/get-block-transaction-id';
import { getBlockTransactionIds } from './lib/actions/blocks/get-block-transaction-ids';
import { getBlockTransactions } from './lib/actions/blocks/get-block-transactions';
import { getBlocksBulk } from './lib/actions/blocks/get-blocks-bulk';

// Transaction Actions
import { getTransaction } from './lib/actions/transactions/get-transaction';
import { getTransactionHex } from './lib/actions/transactions/get-transaction-hex';
import { getTransactionMerkleblockProof } from './lib/actions/transactions/get-transaction-merkleblock-proof';
import { getTransactionMerkleProof } from './lib/actions/transactions/get-transaction-merkle-proof';
import { getTransactionOutspend } from './lib/actions/transactions/get-transaction-outspend';
import { getTransactionOutspends } from './lib/actions/transactions/get-transaction-outspends';
import { getTransactionRaw } from './lib/actions/transactions/get-transaction-raw';
import { getTransactionRbfTimeline } from './lib/actions/transactions/get-transaction-rbf-timeline';
import { getTransactionStatus } from './lib/actions/transactions/get-transaction-status';
import { getTransactionTimes } from './lib/actions/transactions/get-transaction-times';
import { postTransaction } from './lib/actions/transactions/post-transaction';

export const mempoolSpace = createPiece({
  displayName: 'Mempool',
  description: 'The mempool.space website invented the concept of visualizing a Bitcoin node\'s mempool as projected blocks.',
  logoUrl: 'https://cdn.activepieces.com/pieces/mempool-space.png',
  minimumSupportedRelease: '0.20.0',
  authors: ['reemayoush'],
  auth: PieceAuth.None(),
  actions: [
    // General Actions
    getDifficultyAdjustment,
    getPrice,
    getHistoricalPrice,

    // Address Actions
    getAddressDetails,
    getAddressTransactions,
    getAddressTransactionsChain,
    getAddressTransactionsMempool,
    getAddressUtxo,
    validateAddress,

    // Fees Actions
    getMempoolBlocksFees,
    getRecommendedFees,

    // Block Actions
    getBlock,
    getBlockHeader,
    getBlockHeight,
    getBlockTimestamp,
    getBlockRaw,
    getBlockStatus,
    getBlockTipHeight,
    getBlockTipHash,
    getBlockTransactionId,
    getBlockTransactionIds,
    getBlockTransactions,
    getBlocksBulk,

    // Transaction Actions
    getTransaction,
    getTransactionHex,
    getTransactionMerkleblockProof,
    getTransactionMerkleProof,
    getTransactionOutspend,
    getTransactionOutspends,
    getTransactionRaw,
    getTransactionRbfTimeline,
    getTransactionStatus,
    getTransactionTimes,
    postTransaction,

    createCustomApiCallAction({
      baseUrl: () => 'https://mempool.space/api',
      auth: PieceAuth.None(),
    }),
  ],
  triggers: []
});
