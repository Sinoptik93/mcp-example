/**
 * Kaiten API Client
 *
 * HTTP клиент для работы с Kaiten API (https://api.kaiten.ru)
 * Документация API: https://developers.kaiten.ru/
 */

/**
 * Класс для работы с Kaiten API
 */
class KaitenClient {
  constructor(config) {
    this.baseUrl = config.kaiten.baseUrl;
    this.apiKey = config.kaiten.apiKey;
    this.spaceId = config.kaiten.spaceId;
    this.timeout = config.timeout;
  }

  /**
   * Выполняет HTTP запрос к Kaiten API
   */
  async request(endpoint, options = {}) {
    if (!this.apiKey) {
      throw new Error('Kaiten API key not configured. Please set KAITEN_API_KEY in configuration.');
    }

    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      ...options.headers
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(
          `Kaiten API error (${response.status}): ${errorBody || response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${this.timeout}ms`);
      }
      throw error;
    }
  }

  /**
   * Получает информацию о карточке по ID
   */
  async getCard(cardId) {
    if (!cardId) {
      throw new Error('Card ID is required');
    }
    return await this.request(`/api/v1/cards/${cardId}`);
  }

  /**
   * Получает список карточек в пространстве
   */
  async listCards(filters = {}) {
    if (!this.spaceId) {
      throw new Error('Kaiten Space ID not configured. Please set KAITEN_SPACE_ID in configuration.');
    }

    const params = new URLSearchParams({
      space_id: this.spaceId,
      ...filters
    });

    return await this.request(`/api/v1/cards?${params}`);
  }

  /**
   * Обновляет карточку
   */
  async updateCard(cardId, updates) {
    if (!cardId) {
      throw new Error('Card ID is required');
    }

    return await this.request(`/api/v1/cards/${cardId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
  }

  /**
   * Создает новую карточку
   */
  async createCard(cardData) {
    if (!this.spaceId) {
      throw new Error('Kaiten Space ID not configured. Please set KAITEN_SPACE_ID in configuration.');
    }

    return await this.request('/api/v1/cards', {
      method: 'POST',
      body: JSON.stringify({
        space_id: this.spaceId,
        ...cardData
      })
    });
  }
}

export default KaitenClient;
