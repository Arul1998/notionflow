import { Client } from '@notionhq/client';
import { NotionOpStep, PipelineContext } from '../types';
import { resolveStepConfig } from '../context';

let notionClient: Client | null = null;

function getClient(): Client {
  if (!notionClient) {
    const token = process.env.NOTION_TOKEN;
    if (!token) throw new Error('NOTION_TOKEN is not set in your .env file');
    notionClient = new Client({ auth: token });
  }
  return notionClient;
}

export async function runNotionOp(step: NotionOpStep, context: PipelineContext): Promise<any> {
  const notion = getClient();
  const resolved = resolveStepConfig(step as any, context) as NotionOpStep;

  switch (resolved.action) {
    case 'query_database': {
      const dbId = resolved.database || process.env.TASKS_DB_ID;
      if (!dbId) throw new Error(`Step "${step.id}": database ID is required`);

      const filter = buildNotionFilter(resolved.filter);
      const response = await notion.databases.query({
        database_id: dbId,
        ...(filter ? { filter } : {}),
      });

      return response.results.map((page: any) => ({
        id: page.id,
        url: page.url,
        properties: extractProperties(page.properties),
      }));
    }

    case 'create_page': {
      const parentId = resolved.database || process.env.STANDUPS_DB_ID;
      if (!parentId) throw new Error(`Step "${step.id}": database ID is required`);

      const response = await notion.pages.create({
        parent: { database_id: parentId },
        properties: {
          Name: {
            title: [{ text: { content: resolved.title || 'Untitled' } }],
          },
          ...(resolved.properties || {}),
        },
        children: resolved.content
          ? [{ object: 'block', type: 'paragraph', paragraph: { rich_text: [{ text: { content: resolved.content } }] } }]
          : [],
      });

      return { id: (response as any).id, url: (response as any).url };
    }

    case 'get_page': {
      if (!resolved.page_id) throw new Error(`Step "${step.id}": page_id is required`);
      const page = await notion.pages.retrieve({ page_id: resolved.page_id });
      return page;
    }

    case 'update_page': {
      if (!resolved.page_id) throw new Error(`Step "${step.id}": page_id is required`);
      const response = await notion.pages.update({
        page_id: resolved.page_id,
        properties: resolved.properties || {},
      });
      return response;
    }

    default:
      throw new Error(`Unknown notion_op action: ${resolved.action}`);
  }
}

function buildNotionFilter(filter?: Record<string, any>): any {
  if (!filter) return undefined;

  const conditions: any[] = [];

  if (filter.status) {
    const statuses = Array.isArray(filter.status) ? filter.status : [filter.status];
    conditions.push({
      or: statuses.map((s: string) => ({
        property: 'Status',
        select: { equals: s },
      })),
    });
  }

  if (filter.priority) {
    conditions.push({ property: 'Priority', select: { equals: filter.priority } });
  }

  if (conditions.length === 0) return undefined;
  if (conditions.length === 1) return conditions[0];
  return { and: conditions };
}

function extractProperties(props: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(props)) {
    switch (value.type) {
      case 'title': result[key] = value.title.map((t: any) => t.plain_text).join(''); break;
      case 'rich_text': result[key] = value.rich_text.map((t: any) => t.plain_text).join(''); break;
      case 'select': result[key] = value.select?.name || null; break;
      case 'date': result[key] = value.date?.start || null; break;
      case 'checkbox': result[key] = value.checkbox; break;
      case 'number': result[key] = value.number; break;
      default: result[key] = value[value.type];
    }
  }
  return result;
}
