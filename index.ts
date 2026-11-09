import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_API_KEY });

export default async function handler(req: any, res: any) {
  const server = new Server(
    { name: "notion-mcp", version: "1.0.0" },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: "search_notion",
        description: "Search pages and databases in Notion",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string", description: "Search query" },
          },
        },
      },
    ],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name === "search_notion") {
      const query = String(request.params.arguments?.query || "");
      const response = await notion.search({ query });
      return {
        content: [{ type: "text", text: JSON.stringify(response, null, 2) }],
      };
    }
    throw new Error(`Unknown tool: ${request.params.name}`);
  });

  const transport = new SSEServerTransport("/mcp", res);
  await server.connect(transport);
}
