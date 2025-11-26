# План реализации MCP сервера для Kaiten

**Дата создания:** 2025-11-07
**Статус:** Планирование
**Версия:** 1.0

## Цель проекта

Создание MCP (Model Context Protocol) сервера для интеграции с Kaiten API, предоставляющего три основных инструмента для работы с карточками задач.

## Требования

### Функциональные требования

1. **Просмотр конкретной карточки** - получение полной информации о карточке по ID
2. **Просмотр всех карточек с доски** - список карточек с дефолтной доски с базовой фильтрацией
3. **Редактирование карточки** - обновление полей карточки (title, description, status, assignees, tags)

### Технические требования

- Аутентификация через Kaiten API token
- Конфигурируемый board ID через user config
- Structured текстовый формат вывода
- Базовая фильтрация по status, assignee, tags
- Полная обработка ошибок согласно MCP best practices

---

## Архитектура

### 1. Структура проекта

```
mcp-example/
├── server/
│   ├── index.js              # Основной MCP сервер
│   ├── kaiten-client.js      # HTTP клиент для Kaiten API
│   ├── tools/
│   │   ├── get-card.js       # Инструмент: получить карточку
│   │   ├── list-cards.js     # Инструмент: список карточек
│   │   └── update-card.js    # Инструмент: обновить карточку
│   ├── formatters/
│   │   └── card-formatter.js # Форматирование вывода карточек
│   └── utils/
│       ├── error-handler.js  # Обработка ошибок (3-tier model)
│       └── validator.js      # Валидация параметров
├── package.json
├── manifest.json
├── KAITEN_MCP_PLAN.md       # Этот файл
└── CLAUDE.md
```

### 2. MCP Tools (Инструменты)

#### Tool 1: `kaiten_get_card`
**Описание:** Получение конкретной карточки по ID

**Параметры:**
```json
{
  "card_id": {
    "type": "number",
    "description": "ID карточки в Kaiten",
    "required": true
  }
}
```

**Вывод:** Structured текст с полями:
- ID карточки
- Title (название)
- Description (описание)
- Status (статус/колонка)
- Assignees (назначенные пользователи)
- Tags (теги)
- Дата создания и обновления
- URL карточки

#### Tool 2: `kaiten_list_cards`
**Описание:** Список всех карточек с дефолтной доски с фильтрацией

**Параметры:**
```json
{
  "status": {
    "type": "string",
    "description": "Фильтр по статусу/колонке",
    "required": false
  },
  "assignee": {
    "type": "string",
    "description": "Фильтр по назначенному пользователю",
    "required": false
  },
  "tags": {
    "type": "array",
    "description": "Фильтр по тегам",
    "required": false
  }
}
```

**Вывод:** Список карточек в structured формате (ID, title, status, assignees для каждой)

#### Tool 3: `kaiten_update_card`
**Описание:** Обновление полей карточки

**Параметры:**
```json
{
  "card_id": {
    "type": "number",
    "description": "ID карточки для обновления",
    "required": true
  },
  "title": {
    "type": "string",
    "description": "Новое название карточки",
    "required": false
  },
  "description": {
    "type": "string",
    "description": "Новое описание карточки",
    "required": false
  },
  "status": {
    "type": "string",
    "description": "Новый статус/колонка",
    "required": false
  },
  "assignees": {
    "type": "array",
    "description": "Список ID назначенных пользователей",
    "required": false
  },
  "tags": {
    "type": "array",
    "description": "Список тегов",
    "required": false
  }
}
```

**Вывод:** Обновленная карточка в том же формате что и get_card

---

## Конфигурация (manifest.json)

### User Config

```json
{
  "user_config": {
    "api_token": {
      "type": "string",
      "sensitive": true,
      "required": true,
      "title": "Kaiten API Token",
      "description": "API токен для аутентификации в Kaiten"
    },
    "server_url": {
      "type": "string",
      "required": true,
      "title": "Kaiten Server URL",
      "description": "URL вашего Kaiten сервера",
      "default": "https://your-company.kaiten.ru"
    },
    "default_board_id": {
      "type": "number",
      "required": true,
      "title": "Default Board ID",
      "description": "ID доски по умолчанию для работы с карточками"
    }
  }
}
```

---

## Обработка ошибок (Best Practices)

### 3-Tier Error Model

#### 1. Transport-level Errors
- Проблемы с сетевым соединением
- Timeout при запросах к Kaiten API
- DNS ошибки

**Обработка:** Логирование в stderr, retry с exponential backoff

#### 2. Protocol-level Errors (JSON-RPC)
Стандартные коды:
- `-32700` Parse Error
- `-32600` Invalid Request
- `-32601` Method Not Found
- `-32602` Invalid Params

**Обработка:** Возврат стандартных JSON-RPC error объектов

#### 3. Application-level Errors
Custom error codes для Kaiten:
- `-31001` AUTH_REQUIRED - отсутствует API токен
- `-31002` INVALID_TOKEN - невалидный или истекший токен
- `-31003` FORBIDDEN - недостаточно прав доступа
- `-30001` RESOURCE_NOT_FOUND - карточка не найдена
- `-30002` BOARD_NOT_FOUND - доска не найдена
- `-30003` INVALID_BOARD_ID - невалидный ID доски в конфиге
- `-30004` VALIDATION_ERROR - ошибка валидации параметров

**Обработка:** Возврат `{ isError: true, content: [...] }` с понятным сообщением

### Logging Best Practices

- ✅ Логировать в stderr (не stdout!)
- ✅ Включать request ID для трейсинга
- ✅ Удалять чувствительные данные (токены, пароли)
- ✅ Записывать тип ошибки и sanitized сообщение
- ❌ Не раскрывать внутренние детали системы в ответах клиенту
- ❌ Не логировать полные токены, только последние 4 символа

---

## План реализации (Пошаговый)

### Phase 1: Базовая структура ✓
- [x] Изучить Kaiten API документацию
- [x] Изучить MCP best practices
- [x] Определить требования
- [ ] Создать структуру проекта

### Phase 2: Kaiten API клиент
- [ ] Создать `kaiten-client.js`
- [ ] Реализовать аутентификацию (Bearer token)
- [ ] Добавить методы для API запросов:
  - `getCard(cardId)`
  - `getCardsByBoard(boardId, filters)`
  - `updateCard(cardId, updates)`
- [ ] Реализовать error handling
- [ ] Добавить retry logic с exponential backoff

### Phase 3: Утилиты
- [ ] Создать `validator.js` для валидации параметров
- [ ] Создать `error-handler.js` с 3-tier error model
- [ ] Создать `card-formatter.js` для форматирования вывода

### Phase 4: MCP Tools
- [ ] Реализовать `get-card.js`
  - Валидация card_id
  - Вызов Kaiten API
  - Форматирование ответа
  - Error handling
- [ ] Реализовать `list-cards.js`
  - Валидация фильтров
  - Вызов Kaiten API с параметрами
  - Форматирование списка
  - Error handling
- [ ] Реализовать `update-card.js`
  - Валидация всех параметров
  - Проверка что хотя бы одно поле для обновления передано
  - Вызов Kaiten API
  - Форматирование обновленной карточки
  - Error handling

### Phase 5: MCP Server
- [ ] Обновить `server/index.js`
  - Инициализация сервера
  - Чтение user config (api_token, server_url, default_board_id)
  - Регистрация всех 3 tools в ListToolsRequestSchema
  - Маршрутизация в CallToolRequestSchema
  - Глобальный error handler

### Phase 6: Конфигурация
- [ ] Обновить `manifest.json`
  - Добавить user_config
  - Зарегистрировать все 3 tools
  - Настроить env variables
  - Обновить metadata

### Phase 7: Тестирование
- [ ] Ручное тестирование через Claude Desktop
  - Тест `kaiten_get_card` с валидным ID
  - Тест `kaiten_get_card` с невалидным ID
  - Тест `kaiten_list_cards` без фильтров
  - Тест `kaiten_list_cards` с фильтрами
  - Тест `kaiten_update_card` для разных полей
  - Тест error cases (невалидный токен, несуществующая доска)
- [ ] Проверка форматов вывода
- [ ] Проверка обработки ошибок

### Phase 8: Документация
- [ ] Обновить `CLAUDE.md` с информацией о Kaiten MCP
- [ ] Создать `README.md` для пользователей
- [ ] Документировать процесс получения API токена Kaiten
- [ ] Документировать процесс получения Board ID

---

## Технические детали

### Dependencies

```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.12.1"
  }
}
```

**Note:** Используем встроенный `fetch` (Node.js 18+), дополнительные HTTP библиотеки не нужны

### Kaiten API Endpoints (предположительно)

Базируясь на Python клиенте и стандартах REST API:

```
GET    /api/v1/cards/{card_id}              # Получить карточку
GET    /api/v1/boards/{board_id}/cards      # Список карточек
PATCH  /api/v1/cards/{card_id}              # Обновить карточку
```

**Authorization Header:**
```
Authorization: Bearer {api_token}
```

### Пример форматирования вывода (Structured Text)

```
Card #12345: Implement user authentication
Status: In Progress
Description: Add OAuth 2.0 authentication flow for users...

Assignees:
  • John Doe (@johndoe)
  • Jane Smith (@janesmith)

Tags: #authentication #security #backend

Created: 2025-10-15
Updated: 2025-11-05
URL: https://company.kaiten.ru/space/123/card/12345
```

---

## Безопасность

### Чек-лист безопасности

- ✅ API token хранится как sensitive в user config
- ✅ Токены никогда не логируются полностью
- ✅ Валидация всех входных данных
- ✅ Защита от injection атак в параметрах
- ✅ HTTPS для всех запросов к Kaiten API
- ✅ Не раскрывать внутренние ошибки в ответах
- ✅ Implement rate limiting на стороне клиента
- ✅ Clear error messages без чувствительной информации

---

## MCP Best Practices применённые в проекте

1. **Stateful connections** - сохранение конфигурации между запросами
2. **Explicit user consent** - пользователь настраивает доступ через config
3. **Clear tool descriptions** - понятные описания для каждого tool
4. **Input validation** - строгая валидация всех параметров
5. **Error handling** - 3-tier error model
6. **Async/await** - для всех I/O операций
7. **Graceful degradation** - понятные сообщения при ошибках
8. **Logging to stderr** - не мешаем MCP protocol на stdout
9. **Retry logic** - exponential backoff для временных ошибок
10. **Security first** - sensitive данные, HTTPS, валидация

---

## Следующие шаги

1. ✅ План утвержден
2. → Начать реализацию с Phase 2 (Kaiten API клиент)
3. → Протестировать базовый API клиент отдельно
4. → Реализовать tools по одному с тестированием
5. → Интеграция в MCP сервер
6. → Полное end-to-end тестирование

---

## Changelog

### 2025-11-07 - v1.0
- Создан начальный план реализации
- Определена архитектура проекта
- Составлен пошаговый план реализации
- Определены все 3 MCP tools
- Описана стратегия обработки ошибок
