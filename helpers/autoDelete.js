export function autoDelete(message, timeout = 30_000) {
  if (!message) return;

  if (typeof message.delete !== 'function') return;

  setTimeout(() => {
    message.delete().catch(() => {});
  }, timeout);
}