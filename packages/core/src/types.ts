export interface Pipeline {
  name: string;
  on?: {
    schedule?: string;
    webhook?: string;
    manual?: boolean;
  };
  steps: Step[];
}

export interface Step {
  id: string;
  type: 'notion_op' | 'ai_transform' | 'web_research' | 'condition';
  [key: string]: any;
}

export interface NotionOpStep extends Step {
  type: 'notion_op';
  action: 'query_database' | 'create_page' | 'update_page' | 'get_page';
  database?: string;
  page_id?: string;
  filter?: Record<string, any>;
  title?: string;
  content?: string;
  properties?: Record<string, any>;
}

export interface AITransformStep extends Step {
  type: 'ai_transform';
  prompt: string;
  model?: string;
}

export interface WebResearchStep extends Step {
  type: 'web_research';
  query: string;
  save_to?: string;
}

export interface ConditionStep extends Step {
  type: 'condition';
  if: string;
  then: string;
  else?: string;
}

export interface PipelineContext {
  steps: Record<string, { output: any }>;
  env: Record<string, string>;
  date: {
    today: string;
    now: string;
  };
}

export interface RunResult {
  pipeline: string;
  status: 'success' | 'failed';
  steps: StepResult[];
  duration_ms: number;
  error?: string;
}

export interface StepResult {
  id: string;
  type: string;
  status: 'success' | 'failed' | 'skipped';
  output?: any;
  error?: string;
  duration_ms: number;
}
