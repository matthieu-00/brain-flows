const OPENAI_KEY_PATTERN = /^sk-[A-Za-z0-9_-]{20,}$/;
const WEATHER_KEY_PATTERN = /^[A-Za-z0-9]{24,64}$/;

export const isValidOpenAIKey = (key?: string): boolean => {
  if (!key) return false;
  return OPENAI_KEY_PATTERN.test(key.trim());
};

export const isValidWeatherKey = (key?: string): boolean => {
  if (!key) return false;
  return WEATHER_KEY_PATTERN.test(key.trim());
};

/**
 * Validate an OpenAI key. When `required` is true (widget is being enabled),
 * an empty key is treated as an error instead of silently passing.
 */
export const getOpenAIKeyError = (key?: string, required = false): string => {
  if (!key?.trim()) {
    return required ? 'An OpenAI API key is required to use this widget.' : '';
  }
  if (!isValidOpenAIKey(key)) return 'OpenAI key should start with sk- and be at least 24 characters.';
  return '';
};

/**
 * Validate a weather key. When `required` is true (widget is being enabled),
 * an empty key is treated as an error instead of silently passing.
 */
export const getWeatherKeyError = (key?: string, required = false): string => {
  if (!key?.trim()) {
    return required ? 'A weather API key is required to use this widget.' : '';
  }
  if (!isValidWeatherKey(key)) return 'Weather key must be alphanumeric and 24-64 characters.';
  return '';
};
