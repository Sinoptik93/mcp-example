#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import registry from "./registry.js";
import config from "./config.js";

/**
 * MCP Server - главный файл
 *
 * Этот файл содержит только инициализацию сервера и маршрутизацию запросов.
 * Все инструменты автоматически загружаются из директории tools/ через registry.
 */

// Инициализация сервера
const server = new Server(
  {
    name: "hello-world-node",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

// Загрузка конфигурации и инструментов
config.log();
await registry.loadTools();

// Handle tool listing - возвращаем все зарегистрированные инструменты
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: registry.getToolsList(),
  };
});

// Handle tool execution - делегируем выполнение в registry
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    return await registry.executeTool(
      request.params.name,
      request.params.arguments || {},
      config
    );
  } catch (error) {
    // Форматируем ошибку для MCP клиента
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Запуск сервера
const transport = new StdioServerTransport();
await server.connect(transport);

console.error("MCP Server running with tools:", registry.getToolsList().map(t => t.name).join(", "));
