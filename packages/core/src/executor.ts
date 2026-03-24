import { Pipeline, Step, RunResult, StepResult, PipelineContext } from './types';
import { buildContext } from './context';
import { runNotionOp } from './steps/notion_op';
import { runAITransform } from './steps/ai_transform';
import { runCondition, runWebResearch } from './steps/other_steps';

export async function executePipeline(pipeline: Pipeline, env: Record<string, string>): Promise<RunResult> {
  const startTime = Date.now();
  const context: PipelineContext = buildContext(env);
  const stepResults: StepResult[] = [];

  console.log(`\n🚀 Running pipeline: ${pipeline.name}`);
  console.log(`   ${pipeline.steps.length} step(s) to execute\n`);

  for (const step of pipeline.steps) {
    const stepStart = Date.now();
    console.log(`  → [${step.type}] ${step.id}`);

    try {
      const output = await runStep(step, context);
      const duration = Date.now() - stepStart;

      context.steps[step.id] = { output };

      stepResults.push({
        id: step.id,
        type: step.type,
        status: 'success',
        output,
        duration_ms: duration,
      });

      console.log(`  ✓ ${step.id} (${duration}ms)`);

      if (output && typeof output === 'string' && output.length < 200) {
        console.log(`    output: ${output}`);
      } else if (Array.isArray(output)) {
        console.log(`    output: ${output.length} item(s)`);
      }

    } catch (error: any) {
      const duration = Date.now() - stepStart;
      console.error(`  ✗ ${step.id} failed: ${error.message}`);

      stepResults.push({
        id: step.id,
        type: step.type,
        status: 'failed',
        error: error.message,
        duration_ms: duration,
      });

      return {
        pipeline: pipeline.name,
        status: 'failed',
        steps: stepResults,
        duration_ms: Date.now() - startTime,
        error: `Step "${step.id}" failed: ${error.message}`,
      };
    }
  }

  const totalDuration = Date.now() - startTime;
  console.log(`\n✅ Pipeline complete in ${totalDuration}ms\n`);

  return {
    pipeline: pipeline.name,
    status: 'success',
    steps: stepResults,
    duration_ms: totalDuration,
  };
}

async function runStep(step: Step, context: PipelineContext): Promise<any> {
  switch (step.type) {
    case 'notion_op':
      return runNotionOp(step as any, context);
    case 'ai_transform':
      return runAITransform(step as any, context);
    case 'web_research':
      return runWebResearch(step as any, context);
    case 'condition':
      return runCondition(step as any, context);
    default:
      throw new Error(`Unknown step type: ${step.type}`);
  }
}
