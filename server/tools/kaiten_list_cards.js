/**
 * Kaiten List Cards Tool
 *
 * Получает список карточек в пространстве Kaiten с возможностью фильтрации
 */

import KaitenClient from '../utils/kaiten-client.js';
import { formatCardList } from '../utils/formatter.js';

export default {
  name: 'kaiten_list_cards',
  description: 'List cards in Kaiten space with optional filters',

  inputSchema: {
    type: 'object',
    properties: {
      board_id: {
        type: 'number',
        description: 'Filter by board ID (optional)'
      },
      column_id: {
        type: 'number',
        description: 'Filter by column ID (optional)'
      },
      assignee_id: {
        type: 'number',
        description: 'Filter by assignee user ID (optional)'
      },
      limit: {
        type: 'number',
        description: 'Maximum number of cards to return (default: 20)',
        default: 20
      }
    },
    required: []
  },

  async handler(args, config) {
    // Проверка конфигурации
    if (!config.isKaitenConfigured()) {
      return {
        content: [{
          type: 'text',
          text: 'Error: Kaiten is not configured. Please set KAITEN_API_KEY and KAITEN_SPACE_ID in your configuration.'
        }],
        isError: true
      };
    }

    try {
      const client = new KaitenClient(config);

      // Формируем фильтры
      const filters = {};
      if (args.board_id) filters.board_id = args.board_id;
      if (args.column_id) filters.column_id = args.column_id;
      if (args.assignee_id) filters.assignee_id = args.assignee_id;
      if (args.limit) filters.limit = args.limit;

      const response = await client.listCards(filters);
      const cards = response.cards || response; // API может вернуть разную структуру

      return {
        content: [{
          type: 'text',
          text: formatCardList(Array.isArray(cards) ? cards : [])
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Failed to list cards: ${error.message}`
        }],
        isError: true
      };
    }
  }
};
