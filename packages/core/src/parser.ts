import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';
import { Pipeline } from './types';

export function parsePipeline(filePath: string): Pipeline {
  const absolutePath = path.resolve(filePath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Pipeline file not found: ${absolutePath}`);
  }

  const content = fs.readFileSync(absolutePath, 'utf8');
  const parsed = yaml.load(content) as Pipeline;

  if (!parsed.name) throw new Error('Pipeline must have a "name" field');
  if (!parsed.steps || !Array.isArray(parsed.steps)) {
    throw new Error('Pipeline must have a "steps" array');
  }
  if (parsed.steps.length === 0) {
    throw new Error('Pipeline must have at least one step');
  }

  for (const step of parsed.steps) {
    if (!step.id) throw new Error(`Each step must have an "id" field`);
    if (!step.type) throw new Error(`Step "${step.id}" must have a "type" field`);
    const validTypes = ['notion_op', 'ai_transform', 'web_research', 'condition'];
    if (!validTypes.includes(step.type)) {
      throw new Error(`Step "${step.id}" has unknown type "${step.type}". Valid types: ${validTypes.join(', ')}`);
    }
  }

  return parsed;
}
