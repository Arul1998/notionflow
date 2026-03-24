import Anthropic from '@anthropic-ai/sdk';
import { AITransformStep, PipelineContext } from '../types';
import { resolveTemplate } from '../context';

let anthropicClient: Anthropic | null = null;

function getClient(): Anthropic {
  if (!anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set in your .env file');
    anthropicClient = new Anthropic({ apiKey });
  }
  return anthropicClient;
}

export async function runAITransform(step: AITransformStep, context: PipelineContext): Promise<string> {
  const client = getClient();
  const resolvedPrompt = resolveTemplate(step.prompt, context);
  const model = step.model || 'claude-sonnet-4-20250514';

  const message = await client.messages.create({
    model,
    max_tokens: 2048,
    messages: [{ role: 'user', content: resolvedPrompt }],
  });

  const textBlock = message.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error(`Step "${step.id}": AI returned no text content`);
  }

  return textBlock.text;
}
