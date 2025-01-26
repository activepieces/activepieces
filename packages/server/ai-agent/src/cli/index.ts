import { createInterface } from 'readline';
import { aiAgent, Message } from '../lib/ai-agent';
import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables from .env
config({ path: join(__dirname, '../../.env') });

const ANTHROPIC_API_KEY = process.env['ANTHROPIC_API_KEY'];
if (!ANTHROPIC_API_KEY) {
  throw new Error('ANTHROPIC_API_KEY environment variable is not set');
}

// After the check, we can safely assert the type
const apiKey: string = ANTHROPIC_API_KEY;

const readline = createInterface({
  input: process.stdin,
  output: process.stdout,
});

const messages: Message[] = [];

async function chat() {
  try {
    const question = await new Promise<string>((resolve) => {
      readline.question('You: ', resolve);
    });

    if (question.toLowerCase() === 'exit') {
      console.log('Goodbye!');
      readline.close();
      return;
    }

    messages.push({ role: 'user', content: question });
    
    process.stdout.write('Assistant: ');
    let response = '';
    
    for await (const chunk of aiAgent(messages, apiKey).textStream) {
      process.stdout.write(chunk);
      response += chunk;
    }
    process.stdout.write('\n\n');
    
    messages.push({ role: 'assistant', content: response });
    chat();
  } catch (error) {
    console.error('Error:', error);
    readline.close();
  }
}

console.log('AI Agent CLI (type "exit" to quit)\n');
chat();
