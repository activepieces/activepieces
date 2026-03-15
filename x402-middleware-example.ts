// x402 payment hook for Fastify
fastify.addHook('onRequest', async (request, reply) => {
  if (!request.url.startsWith('/api')) return;
  const payment = request.headers['x-payment'];
  if (!payment) {
    reply.code(402).send({
      accepts: [{ network: 'eip155:8453', asset: 'USDC', address: process.env.X402_WALLET_ADDRESS }],
      price: '0.01',
    });
  }
  // Verify payment with facilitator
});
