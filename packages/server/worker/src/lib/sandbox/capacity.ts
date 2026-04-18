// firstBoxUid / numBoxes must match packages/server/api/src/assets/default.cf
// (isolate's `first_uid` and `num_boxes`) — iptables owner-match and sandbox UID
// assignment both rely on the same contiguous range.
const FIRST_BOX_UID = 60000
const NUM_BOXES = 1000
const WS_RPC_BASE_PORT = 52000

export const sandboxCapacity = {
    firstBoxUid: FIRST_BOX_UID,
    numBoxes: NUM_BOXES,
    wsRpcBasePort: WS_RPC_BASE_PORT,
    wsRpcPortForBox: (boxId: number): number => WS_RPC_BASE_PORT + boxId,
    wsRpcPortRange: { first: WS_RPC_BASE_PORT, last: WS_RPC_BASE_PORT + NUM_BOXES - 1 },
}
