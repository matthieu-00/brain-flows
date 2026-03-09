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

export const getOpenAIKeyError = (key?: string): string => {
  if (!key?.trim()) return 'OpenAI API key is required.';
  if (!isValidOpenAIKey(key)) return 'OpenAI key should start with sk- and be at least 24 characters.';
  return '';
};

export const getWeatherKeyError = (key?: string): string => {
  if (!key?.trim()) return '';
  if (!isValidWeatherKey(key)) return 'Weather key must be alphanumeric and 24-64 characters.';
  return '';
};
