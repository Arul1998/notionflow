# NotionFlow

> A YAML-driven AI workflow engine for Notion — built with Notion MCP

NotionFlow lets you define intelligent, multi-step agent pipelines as YAML files, version-control them in Git, and execute them against your Notion workspace. Think **GitHub Actions, but for your knowledge work**.

```yaml
name: Daily standup report
steps:
  - id: fetch_tasks
    type: notion_op
    action: query_database
    database: "{{env.TASKS_DB_ID}}"
    filter:
      status: ["In Progress", "Done"]

  - id: generate_standup
    type: ai_transform
    prompt: |
      Given these tasks: {{steps.fetch_tasks.output}}
      Write a concise standup: done, in progress, blockers.

  - id: save_report
    type: notion_op
    action: create_page
    database: "{{env.STANDUPS_DB_ID}}"
    title: "Standup {{date.today}}"
    content: "{{steps.generate_standup.output}}"
```

Then just run:
```bash
notionflow run examples/standup-report.yml
```

---

## Why NotionFlow?

Notion's built-in agents are powerful but GUI-driven. NotionFlow is for engineers who want:

- **Pipelines as code** — YAML files you can version, review, and deploy like any other config
- **Composable steps** — chain Notion reads, AI transforms, web research, and conditional logic
- **CLI-first** — run pipelines from your terminal, CI/CD, or cron jobs
- **Open and extensible** — add your own step types in TypeScript

---

## Architecture

```
pipeline.yml
     │
     ▼
┌─────────────────────────────────┐
│         Pipeline Engine          │
│  YAML parser → Step executor    │
│  Context passing → Error handling│
└─────────────┬───────────────────┘
              │
    ┌─────────┼──────────┐
    ▼         ▼          ▼
notion_op  ai_transform  web_research
(MCP)      (Claude API)  (Claude + search)
    │         │          │
    └─────────┴──────────┘
              │
              ▼
     Notion Workspace
```

---

## Step types

| Type | What it does |
|------|-------------|
| `notion_op` | Read/write Notion databases and pages via MCP |
| `ai_transform` | Use Claude to process, summarise, or generate content |
| `web_research` | Search the web and return a summary |
| `condition` | Branch pipeline flow based on any condition |

---

## Getting started

### Prerequisites
- Node.js 18+
- A Notion workspace
- An Anthropic API key

### Installation

```bash
git clone https://github.com/Arul1998/notionflow.git
cd notionflow
npm install
npm run build
```

### Configuration

Create a `.env` file in the root:

```env
NOTION_TOKEN=your_notion_integration_token
ANTHROPIC_API_KEY=your_anthropic_api_key
TASKS_DB_ID=your_tasks_database_id
STANDUPS_DB_ID=your_standups_database_id
```

### Run your first pipeline

```bash
# Validate a pipeline without running it
npx ts-node packages/cli/src/index.ts validate examples/standup-report.yml

# Run the standup report
npx ts-node packages/cli/src/index.ts run examples/standup-report.yml

# Run the task triage
npx ts-node packages/cli/src/index.ts run examples/task-triage.yml

# Run web research and save to Notion
npx ts-node packages/cli/src/index.ts run examples/research-and-save.yml
```

---

## Example pipelines

### Daily standup report
Reads your in-progress and done tasks, generates a standup summary with Claude, and saves it to your Standups database.
```bash
notionflow run examples/standup-report.yml
```

### Task triage
Analyses all your tasks, categorises them by urgency, and produces a prioritised action plan saved to Notion.
```bash
notionflow run examples/task-triage.yml
```

### Research and save
Searches the web on any topic, summarises the findings with Claude, and saves a structured knowledge base entry to Notion.
```bash
notionflow run examples/research-and-save.yml
```

---

## Pipeline syntax

```yaml
name: My pipeline          # Required — pipeline name
on:
  schedule: "0 9 * * 1-5"  # Cron schedule (optional)
  manual: true              # Allow manual trigger

steps:
  - id: my_step            # Required — unique step ID
    type: notion_op        # Required — step type
    action: query_database
    database: "{{env.TASKS_DB_ID}}"
```

### Template variables

Reference outputs from previous steps using `{{...}}`:

```yaml
prompt: "Summarise these tasks: {{steps.fetch_tasks.output}}"
title: "Report for {{date.today}}"
database: "{{env.TASKS_DB_ID}}"
```

---

## Project structure

```
notionflow/
├── packages/
│   ├── core/              # Pipeline engine (parser, executor, steps)
│   └── cli/               # notionflow CLI tool
├── examples/              # Ready-to-use pipeline examples
│   ├── standup-report.yml
│   ├── task-triage.yml
│   └── research-and-save.yml
└── .env.example           # Environment variable template
```

---

## Built for the Notion MCP Challenge

This project was built as a submission for the [DEV.to Notion MCP Challenge](https://dev.to/challenges/notion-2026-03-04). It uses Notion MCP as its core integration layer for all workspace reads and writes.

---

## License

MIT — see [LICENSE](LICENSE)
