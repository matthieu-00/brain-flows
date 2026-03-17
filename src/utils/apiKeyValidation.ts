const WEATHER_KEY_PATTERN = /^[A-Za-z0-9]{24,64}$/;

export const isValidWeatherKey = (key?: string): boolean => {
  if (!key) return false;
  return WEATHER_KEY_PATTERN.test(key.trim());
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
