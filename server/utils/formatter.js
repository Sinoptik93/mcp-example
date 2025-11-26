/**
 * Formatter Utilities
 *
 * Утилиты для форматирования данных из Kaiten API
 * для удобного отображения пользователю
 */

/**
 * Форматирует карточку Kaiten в читаемый текст
 */
export function formatCard(card) {
  const lines = [
    `# Карточка: ${card.title || 'Без названия'}`,
    ``,
    `**ID:** ${card.id}`,
    `**Статус:** ${card.column?.title || 'Неизвестен'}`,
  ];

  if (card.description) {
    lines.push(``, `**Описание:**`, card.description);
  }

  if (card.assignee) {
    lines.push(``, `**Исполнитель:** ${card.assignee.full_name || card.assignee.email}`);
  }

  if (card.due_date) {
    lines.push(`**Срок:** ${new Date(card.due_date).toLocaleDateString('ru-RU')}`);
  }

  if (card.tags && card.tags.length > 0) {
    lines.push(``, `**Теги:** ${card.tags.map(t => t.name).join(', ')}`);
  }

  if (card.url) {
    lines.push(``, `**Ссылка:** ${card.url}`);
  }

  return lines.join('\n');
}

/**
 * Форматирует список карточек в читаемый текст
 */
export function formatCardList(cards) {
  if (!cards || cards.length === 0) {
    return 'Карточки не найдены.';
  }

  const lines = [`# Найдено карточек: ${cards.length}`, ``];

  cards.forEach((card, index) => {
    lines.push(
      `${index + 1}. **${card.title || 'Без названия'}**`,
      `   ID: ${card.id} | Статус: ${card.column?.title || 'Неизвестен'}`,
      ``
    );
  });

  return lines.join('\n');
}

/**
 * Форматирует результат обновления карточки
 */
export function formatUpdateResult(card, updatedFields) {
  const lines = [
    `✓ Карточка успешно обновлена`,
    ``,
    `**ID:** ${card.id}`,
    `**Название:** ${card.title}`,
    ``,
    `**Обновленные поля:**`
  ];

  Object.keys(updatedFields).forEach(field => {
    lines.push(`- ${field}: ${updatedFields[field]}`);
  });

  if (card.url) {
    lines.push(``, `**Ссылка:** ${card.url}`);
  }

  return lines.join('\n');
}
