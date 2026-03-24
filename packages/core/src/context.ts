import { PipelineContext } from './types';

export function buildContext(env: Record<string, string>): PipelineContext {
  const now = new Date();
  return {
    steps: {},
    env,
    date: {
      today: now.toISOString().split('T')[0],
      now: now.toISOString(),
    },
  };
}

export function resolveTemplate(template: string, context: PipelineContext): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
    const trimmed = path.trim();
    const value = getNestedValue(context, trimmed);
    if (value === undefined) {
      console.warn(`  ⚠ Template variable not found: ${trimmed}`);
      return match;
    }
    return typeof value === 'object' ? JSON.stringify(value) : String(value);
  });
}

function getNestedValue(obj: any, path: string): any {
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    current = current[part];
  }
  return current;
}

export function resolveStepConfig(config: Record<string, any>, context: PipelineContext): Record<string, any> {
  const resolved: Record<string, any> = {};
  for (const [key, value] of Object.entries(config)) {
    if (typeof value === 'string') {
      resolved[key] = resolveTemplate(value, context);
    } else if (typeof value === 'object' && value !== null) {
      resolved[key] = resolveStepConfig(value, context);
    } else {
      resolved[key] = value;
    }
  }
  return resolved;
}
