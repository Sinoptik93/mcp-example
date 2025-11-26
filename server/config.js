/**
 * Configuration Module
 *
 * Читает конфигурацию из переменных окружения, которые передаются
 * через manifest.json секцию "env" с использованием ${user_config.*}
 *
 * Пример в manifest.json:
 * "env": {
 *   "KAITEN_API_KEY": "${user_config.kaiten_api_key}",
 *   "KAITEN_BASE_URL": "${user_config.kaiten_base_url}"
 * }
 */

class Config {
  constructor() {
    // Kaiten API configuration
    this.kaiten = {
      apiKey: process.env.KAITEN_API_KEY || '',
      baseUrl: process.env.KAITEN_BASE_URL || 'https://api.kaiten.ru',
      spaceId: process.env.KAITEN_SPACE_ID || ''
    };

    // General settings
    this.debug = process.env.DEBUG === 'true' || false;
    this.timeout = parseInt(process.env.REQUEST_TIMEOUT || '30000', 10);
  }

  /**
   * Проверяет, настроена ли Kaiten интеграция
   */
  isKaitenConfigured() {
    return !!(this.kaiten.apiKey && this.kaiten.spaceId);
  }

  /**
   * Логирует текущую конфигурацию (без секретов)
   */
  log() {
    console.error('[Config] Configuration loaded:');
    console.error(`  - Kaiten Base URL: ${this.kaiten.baseUrl}`);
    console.error(`  - Kaiten API Key: ${this.kaiten.apiKey ? '***' + this.kaiten.apiKey.slice(-4) : 'not set'}`);
    console.error(`  - Kaiten Space ID: ${this.kaiten.spaceId || 'not set'}`);
    console.error(`  - Debug mode: ${this.debug}`);
    console.error(`  - Request timeout: ${this.timeout}ms`);
  }
}

// Singleton instance
const config = new Config();

export default config;
