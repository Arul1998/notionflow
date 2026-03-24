import { ConditionStep, WebResearchStep, PipelineContext } from '../types';
import { resolveTemplate } from '../context';
import Anthropic from '@anthropic-ai/sdk';

export async function runCondition(step: ConditionStep, context: PipelineContext): Promise<{ next: string | null; result: boolean }> {
  const condition = resolveTemplate(step.if, context);

  let result = false;
  try {
    result = Boolean(eval(condition));
  } catch {
    result = condition !== '' && condition !== 'null' && condition !== 'undefined' && condition !== '[]';
  }

  return { next: result ? step.then : (step.else || null), result };
}

export async function runWebResearch(step: WebResearchStep, context: PipelineContext): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set in your .env file');

  const client = new Anthropic({ apiKey });
  const resolvedQuery = resolveTemplate(step.query, context);

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    tools: [{ type: 'web_search_20250305', name: 'web_search' } as any],
    messages: [{ role: 'user', content: `Research this topic and provide a concise, factual summary: ${resolvedQuery}` }],
  });

  const textBlocks = message.content.filter((b) => b.type === 'text');
  if (textBlocks.length === 0) throw new Error(`Step "${step.id}": web research returned no results`);

  return textBlocks.map((b: any) => b.text).join('\n');
}
