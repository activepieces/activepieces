import { FlowVersion } from '../flow-version';
import { FlowTrigger } from '../triggers/trigger';
export declare const flowPieceUtil: {
    makeFlowAutoUpgradable(flowVersion: FlowVersion): FlowVersion;
    getExactVersion(pieceVersion: string): string;
    getUsedPieces(trigger: FlowTrigger): string[];
    getMostRecentPatchVersion(pieceVersion: string): string;
};
