#!/usr/bin/env node
import * as dotenv from 'dotenv';
import * as path from 'path';
import { parsePipeline, executePipeline } from '@notionflow/core';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const args = process.argv.slice(2);
const command = args[0];

async function main() {
  if (!command || command === 'help' || command === '--help') {
    printHelp();
    return;
  }

  if (command === 'run') {
    const pipelineFile = args[1];
    if (!pipelineFile) {
      console.error('❌  Usage: notionflow run <pipeline.yml>');
      process.exit(1);
    }
    await runPipeline(pipelineFile);
    return;
  }

  if (command === 'validate') {
    const pipelineFile = args[1];
    if (!pipelineFile) {
      console.error('❌  Usage: notionflow validate <pipeline.yml>');
      process.exit(1);
    }
    await validatePipeline(pipelineFile);
    return;
  }

  console.error(`❌  Unknown command: ${command}`);
  printHelp();
  process.exit(1);
}

async function runPipeline(filePath: string) {
  try {
    const pipeline = parsePipeline(filePath);

    const env: Record<string, string> = {
      NOTION_TOKEN: process.env.NOTION_TOKEN || '',
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
      TASKS_DB_ID: process.env.TASKS_DB_ID || '',
      STANDUPS_DB_ID: process.env.STANDUPS_DB_ID || '',
    };

    const result = await executePipeline(pipeline, env);

    if (result.status === 'failed') {
      console.error(`\n❌  Pipeline failed: ${result.error}`);
      process.exit(1);
    }

    console.log('📋  Run summary:');
    for (const step of result.steps) {
      const icon = step.status === 'success' ? '✓' : '✗';
      console.log(`   ${icon} ${step.id} (${step.duration_ms}ms)`);
    }
    console.log(`\n⏱  Total: ${result.duration_ms}ms`);

  } catch (error: any) {
    console.error(`\n❌  Error: ${error.message}`);
    process.exit(1);
  }
}

async function validatePipeline(filePath: string) {
  try {
    const pipeline = parsePipeline(filePath);
    console.log(`✅  Pipeline "${pipeline.name}" is valid`);
    console.log(`   ${pipeline.steps.length} step(s): ${pipeline.steps.map((s: { id: string }) => s.id).join(', ')}`);
  } catch (error: any) {
    console.error(`❌  Invalid pipeline: ${error.message}`);
    process.exit(1);
  }
}

function printHelp() {
  console.log(`
NotionFlow — YAML-driven AI workflow engine for Notion

Usage:
  notionflow run <pipeline.yml>       Run a pipeline
  notionflow validate <pipeline.yml>  Validate a pipeline without running it
  notionflow help                     Show this help

Examples:
  notionflow run examples/standup-report.yml
  notionflow run examples/task-triage.yml
  notionflow validate examples/research-and-save.yml
  `);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
