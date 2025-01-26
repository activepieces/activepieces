import { createInterface } from 'readline';
import { aiAgent, Message } from '../lib/ai-agent';
import { config } from 'dotenv';
import { join } from 'path';
import { llmMessageParser } from '../lib/llm-parser';

config({ path: join(__dirname, '../../.env') });

const ANTHROPIC_API_KEY = process.env['ANTHROPIC_API_KEY'];
if (!ANTHROPIC_API_KEY) {
  throw new Error('ANTHROPIC_API_KEY environment variable is not set');
}

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

    const response = await aiAgent.run(messages, apiKey);
    console.dir(response, { depth: null, colors: true });
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
