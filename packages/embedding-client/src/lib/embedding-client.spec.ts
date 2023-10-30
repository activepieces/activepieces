import { embeddingClient } from './embedding-client';

describe('embeddingClient', () => {
  it('should work', () => {
    expect(embeddingClient()).toEqual('embedding-client');
  });
});
