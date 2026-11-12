const batchSubgraphEndId = (batchName: string) =>
  `${batchName}-batch-subgraph-end`;

const batchStartEdgeId = (batchName: string) => `${batchName}-batch-start-edge`;

const batchRegionId = (batchName: string) => `${batchName}-batch-region`;

const bigAddButtonId = ({
  parentStepName,
  edgeId,
}: {
  parentStepName: string;
  edgeId: string;
}) => `${parentStepName}-big-add-button-${edgeId}`;

export const canvasElementIds = {
  batchSubgraphEndId,
  batchStartEdgeId,
  batchRegionId,
  bigAddButtonId,
};
