import { sellsy } from './index';

describe('Sellsy Piece', () => {
  it('should export the piece correctly', () => {
    expect(sellsy).toBeDefined();
    expect(sellsy.displayName).toBe('Sellsy');
    expect(sellsy.auth).toBeDefined();
    expect(sellsy.actions).toBeDefined();
    expect(sellsy.triggers).toBeDefined();
  });

  it('should have authentication configured', () => {
    expect(sellsy.auth).toBeDefined();
    expect(sellsy.auth.props).toBeDefined();
    expect(sellsy.auth.props.access_token).toBeDefined();
  });

  it('should have actions and triggers', () => {
    expect(sellsy.actions).toBeDefined();
    expect(sellsy.triggers).toBeDefined();
  });
}); 