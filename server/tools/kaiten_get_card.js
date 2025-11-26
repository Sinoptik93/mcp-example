/**
 * Kaiten Get Card Tool
 *
 * Получает детальную информацию о карточке Kaiten по её ID
 */

import KaitenClient from '../utils/kaiten-client.js';
import { formatCard } from '../utils/formatter.js';

export default {
  name: 'kaiten_get_card',
  description: 'Get detailed information about a Kaiten card by ID',

  inputSchema: {
    type: 'object',
    properties: {
      card_id: {
        type: 'number',
        description: 'The ID of the card to retrieve'
      }
    },
    required: ['card_id']
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
      const card = await client.getCard(args.card_id);

      return {
        content: [{
          type: 'text',
          text: formatCard(card)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Failed to get card: ${error.message}`
        }],
        isError: true
      };
    }
  }
};
