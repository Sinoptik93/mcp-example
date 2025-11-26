/**
 * Get Current Time Tool
 *
 * Возвращает текущее время компьютера в удобочитаемом формате.
 * Использует русскую локализацию для форматирования даты и времени.
 */

export default {
  name: 'get_current_time',
  description: 'Get the current computer time',

  // JSON Schema для валидации входных параметров
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },

  // Обработчик инструмента
  async handler(args, config) {
    const now = new Date();
    const timeString = now.toLocaleString("ru-RU", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZoneName: "short",
    });

    return {
      content: [
        {
          type: "text",
          text: `The current time is: ${timeString}`,
        },
      ],
    };
  }
};
