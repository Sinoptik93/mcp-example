/**
 * Kaiten Update Card Tool
 *
 * Обновляет поля карточки Kaiten
 */

import KaitenClient from '../utils/kaiten-client.js';
import { formatUpdateResult } from '../utils/formatter.js';

export default {
  name: 'kaiten_update_card',
  description: 'Update a Kaiten card with new data',

  inputSchema: {
    type: 'object',
    properties: {
      card_id: {
        type: 'number',
        description: 'The ID of the card to update'
      },
      title: {
        type: 'string',
        description: 'New title for the card (optional)'
      },
      description: {
        type: 'string',
        description: 'New description for the card (optional)'
      },
      column_id: {
        type: 'number',
        description: 'Move card to this column ID (optional)'
      },
      assignee_id: {
        type: 'number',
        description: 'Assign card to this user ID (optional)'
      },
      due_date: {
        type: 'string',
        description: 'Set due date in ISO format YYYY-MM-DD (optional)'
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

      // Формируем объект обновлений (только указанные поля)
      const updates = {};
      if (args.title !== undefined) updates.title = args.title;
      if (args.description !== undefined) updates.description = args.description;
      if (args.column_id !== undefined) updates.column_id = args.column_id;
      if (args.assignee_id !== undefined) updates.assignee_id = args.assignee_id;
      if (args.due_date !== undefined) updates.due_date = args.due_date;

      // Проверяем, что хотя бы одно поле для обновления указано
      if (Object.keys(updates).length === 0) {
        return {
          content: [{
            type: 'text',
            text: 'Error: No fields to update specified. Please provide at least one field to update.'
          }],
          isError: true
        };
      }

      const updatedCard = await client.updateCard(args.card_id, updates);

      return {
        content: [{
          type: 'text',
          text: formatUpdateResult(updatedCard, updates)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Failed to update card: ${error.message}`
        }],
        isError: true
      };
    }
  }
};
