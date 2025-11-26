# Промпт для инструмента kaiten_get_card

## Описание инструмента для MCP сервера

### Название инструмента
`kaiten_get_card`

### Описание (description)
Получение полной информации о карточке из Kaiten по её ID или по ссылке на карточку. Инструмент извлекает ID из ссылки, если передан URL, и возвращает все детали карточки: название, описание, статус, назначенных пользователей, теги, даты создания и обновления, а также прямую ссылку на карточку.

### Схема входных параметров (inputSchema)

```json
{
  "type": "object",
  "properties": {
    "card_id": {
      "type": "number",
      "description": "ID карточки в Kaiten. Используйте этот параметр, если у вас есть числовой идентификатор карточки."
    },
    "card_url": {
      "type": "string",
      "description": "URL ссылка на карточку в формате https://your-domain.kaiten.ru/space/{space_id}/boards/card/{card_id}, https://your-domain.kaiten.ru/space/{space_id}/card/{card_id} или https://your-domain.kaiten.ru/card/{card_id}. Инструмент автоматически извлечет ID из ссылки. Используйте этот параметр, если у вас есть ссылка на карточку."
    }
  },
  "oneOf": [
    { "required": ["card_id"] },
    { "required": ["card_url"] }
  ]
}
```

### Формат ответа

Инструмент возвращает структурированный текст с полной информацией о карточке:

```
Card #{id}: {title}
Status: {status}
Description: {description}

Assignees:
  • {assignee_name} (@{username})
  • ...

Tags: #{tag1} #{tag2} ...

Created: {created_date}
Updated: {updated_date}
URL: {card_url}
```

### Примеры использования

**Пример 1: Получение карточки по ID**
```json
{
  "card_id": 12345
}
```

**Пример 2: Получение карточки по полной ссылке (с boards)**
```json
{
  "card_url": "https://dodopizza.kaiten.ru/space/95689/boards/card/55967368"
}
```

**Пример 3: Получение карточки по ссылке (без boards)**
```json
{
  "card_url": "https://company.kaiten.ru/space/123/card/67890"
}
```

**Пример 4: Получение карточки по короткой ссылке**
```json
{
  "card_url": "https://company.kaiten.ru/card/67890"
}
```

### Технические детали

- **API Endpoint**: `GET /api/latest/cards/{card_id}`
- **Аутентификация**: Bearer token из user config (`api_token`)
- **Base URL**: Из user config (`server_url`)
- **Обработка ошибок**: 
  - Если карточка не найдена (404) → возвращает понятное сообщение об ошибке
  - Если невалидный токен (401) → возвращает ошибку аутентификации
  - Если недостаточно прав (403) → возвращает ошибку доступа
  - Если невалидный формат URL → возвращает ошибку валидации

### Логика извлечения ID из URL

Инструмент должен поддерживать следующие форматы URL:
- `https://domain.kaiten.ru/space/{space_id}/boards/card/{card_id}` → извлекает `card_id` (основной формат)
- `https://domain.kaiten.ru/space/{space_id}/card/{card_id}` → извлекает `card_id`
- `https://domain.kaiten.ru/card/{card_id}` → извлекает `card_id`
- `https://domain.kaiten.ru/cards/{card_id}` → извлекает `card_id`

Регулярное выражение для извлечения: `/(?:card|cards)/(\d+)`

**Пример реальной ссылки:** `https://dodopizza.kaiten.ru/space/95689/boards/card/55967368` → извлекает `55967368`

### Валидация

- Если переданы оба параметра (`card_id` и `card_url`), приоритет у `card_id`
- Если не передан ни один параметр, возвращается ошибка валидации
- `card_id` должен быть положительным числом
- `card_url` должен быть валидным URL и содержать ID карточки

