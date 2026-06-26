export const sanitizeNotificationMessage = (message = '') => {
  if (message === null || message === undefined) return '';

  return String(message)
    .replace(/[\u{1F300}-\u{1FAFF}]/gu, '')
    .replace(/[\u{2600}-\u{26FF}]/gu, '')
    .replace(/[\u{2700}-\u{27BF}]/gu, '')
    .replace(/[\u{FE0E}\u{FE0F}\u{200D}]/gu, '')
    .trim();
};
