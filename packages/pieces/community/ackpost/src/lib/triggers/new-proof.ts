import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { ackpostAuth } from '../common/auth';
import { createClient, callMcp, MCP_BASE_URL } from '../common/client';

type ProofEvent = {
  id: string;
  published_at?: string;
};

type SearchProofsResult = {
  proofs: ProofEvent[];
};

function toTimestamp(value?: string): number {
  if (!value) {
    return 0;
  }
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export const newProof = createTrigger({
  auth: ackpostAuth,
  name: 'new_proof',
  displayName: 'New Publish Proof',
  description: 'Triggers when a post is published successfully and a proof artifact is captured.',
  type: TriggerStrategy.POLLING,
  props: {},
  sampleData: {
    id: 'proof_abc123',
    draft_id: 'draft_xyz',
    destination: 'Facebook Page',
    status: 'success',
    proof_url: 'https://ackpost.com/proofs/proof_abc123',
    published_at: '2026-05-27T12:00:00Z',
  },
  async onEnable(context) {
    const { store } = context;
    await store.put('lastPoll', new Date(Date.now() - 5 * 60 * 1000).toISOString());
  },
  async onDisable() {
    return;
  },
  async run(context) {
    const { auth, store } = context;
    const client = createClient(MCP_BASE_URL, auth.apiKey);
    const lastPoll = (await store.get('lastPoll')) as string | undefined || new Date(Date.now() - 86400000).toISOString();
    const result = await callMcp<SearchProofsResult>(client, 'proof/search', {
      workspace_id: auth.workspaceId,
      since: lastPoll,
    });
    const proofs = result.proofs || [];
    const currentWatermark = toTimestamp(lastPoll);
    const maxPublishedAt = proofs.reduce((maxSeen, proof) => {
      return Math.max(maxSeen, toTimestamp(proof.published_at));
    }, currentWatermark);

    // Add a tiny overlap window to reduce chance of missing late-arriving records.
    const nextWatermark = new Date(Math.max(currentWatermark, maxPublishedAt - 2000)).toISOString();
    await store.put('lastPoll', nextWatermark);

    return proofs;
  },
});
