import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Tool Registry - автоматическая регистрация всех инструментов из директории tools/
 *
 * Каждый инструмент должен экспортировать объект с полями:
 * - name: string - уникальное имя инструмента
 * - description: string - описание для пользователя
 * - inputSchema: object - JSON Schema для валидации параметров
 * - handler: async function(args, config) - функция-обработчик
 */
class ToolRegistry {
  constructor() {
    this.tools = new Map();
  }

  /**
   * Загружает все инструменты из директории tools/
   */
  async loadTools() {
    const toolsDir = path.join(__dirname, 'tools');

    try {
      const files = await fs.readdir(toolsDir);
      const jsFiles = files.filter(f => f.endsWith('.js'));

      for (const file of jsFiles) {
        try {
          const toolPath = path.join(toolsDir, file);
          const toolModule = await import(`file://${toolPath}`);
          const tool = toolModule.default;

          // Валидация структуры инструмента
          if (!tool.name || !tool.description || !tool.handler) {
            console.error(`[Registry] Пропущен ${file}: отсутствуют обязательные поля (name, description, handler)`);
            continue;
          }

          this.tools.set(tool.name, tool);
          console.error(`[Registry] Загружен инструмент: ${tool.name}`);
        } catch (error) {
          console.error(`[Registry] Ошибка загрузки ${file}:`, error.message);
        }
      }

      console.error(`[Registry] Всего загружено инструментов: ${this.tools.size}`);
    } catch (error) {
      console.error('[Registry] Ошибка чтения директории tools/:', error.message);
    }
  }

  /**
   * Возвращает список всех инструментов для MCP ListTools
   */
  getToolsList() {
    return Array.from(this.tools.values()).map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema || {
        type: 'object',
        properties: {},
        required: []
      }
    }));
  }

  /**
   * Выполняет инструмент по имени
   */
  async executeTool(name, args, config) {
    const tool = this.tools.get(name);

    if (!tool) {
      throw new Error(`Unknown tool: ${name}`);
    }

    try {
      return await tool.handler(args, config);
    } catch (error) {
      console.error(`[Registry] Ошибка выполнения ${name}:`, error);
      throw error;
    }
  }

  /**
   * Проверяет, существует ли инструмент
   */
  hasTool(name) {
    return this.tools.has(name);
  }
}

// Singleton instance
const registry = new ToolRegistry();

export default registry;
