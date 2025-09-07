import { echoMessage } from './echo-message-action';
import { createMockContext, validateActionProperties, validateActionMetadata } from '../test-utils/helpers';

describe('Echo Message Action', () => {
  it('should echo the input message correctly', async () => {
    const testMessage = 'Hello, World!';
    const context = createMockContext({ message: testMessage });

    const result = await echoMessage.run(context);
    
    expect(result).toEqual({
      message: testMessage,
    });
  });

  it('should handle empty string messages', async () => {
    const testMessage = '';
    const context = createMockContext({ message: testMessage });

    const result = await echoMessage.run(context);
    
    expect(result).toEqual({
      message: testMessage,
    });
  });

  it('should handle special characters in messages', async () => {
    const testMessage = 'Special chars: !@#$%^&*()_+-=[]{}|;:,.<>?';
    const context = createMockContext({ message: testMessage });

    const result = await echoMessage.run(context);
    
    expect(result).toEqual({
      message: testMessage,
    });
  });

  it('should handle unicode characters', async () => {
    const testMessage = 'Unicode: 🚀 🌟 💻 🎉';
    const context = createMockContext({ message: testMessage });

    const result = await echoMessage.run(context);
    
    expect(result).toEqual({
      message: testMessage,
    });
  });

  it('should have correct action metadata', () => {
    validateActionMetadata(echoMessage, 'echo_message', 'Echo Message');
    expect(echoMessage.description).toBe('Echoes a message back');
  });

  it('should have correct property configuration', () => {
    validateActionProperties(echoMessage, ['message']);
    expect(echoMessage.props.message.displayName).toBe('Message');
    expect(echoMessage.props.message.description).toBe('The message to echo');
    expect(echoMessage.props.message.required).toBe(true);
  });
});
