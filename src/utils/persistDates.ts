const DATE_KEYS = new Set(['createdAt', 'updatedAt', 'timestamp', 'lastSaved']);

export const dateReplacer = (_key: string, value: unknown) => {
  if (value instanceof Date) {
    return value.toISOString();
  }
  return value;
};

export const dateReviver = (key: string, value: unknown) => {
  if (
    DATE_KEYS.has(key) &&
    typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}T/.test(value)
  ) {
    return new Date(value);
  }
  return value;
};
