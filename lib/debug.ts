const isDebugMode = process.env.EXPO_PUBLIC_DEBUG_MODE === "true";

const createDebugger = (prefix: string) => ({
  log: (...args: any[]) => {
    if (isDebugMode) {
      console.log(`[${prefix}]`, ...args);
    }
  },
  error: (...args: any[]) => {
    if (isDebugMode) {
      console.error(`[${prefix}]`, ...args);
    }
  },
  warn: (...args: any[]) => {
    if (isDebugMode) {
      console.warn(`[${prefix}]`, ...args);
    }
  },
});

export const debug = createDebugger("Client");
export const debugServer = createDebugger("Server");

export const sanitizeForLogging = (data: any) => {
  if (typeof data !== "object" || data === null) {
    return data;
  }

  const sanitized = { ...data };
  const sensitiveKeys = ["password", "token", "secret", "key", "auth"];

  Object.keys(sanitized).forEach((key) => {
    if (
      sensitiveKeys.some((sensitive) => key.toLowerCase().includes(sensitive))
    ) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof sanitized[key] === "object") {
      sanitized[key] = sanitizeForLogging(sanitized[key]);
    }
  });

  return sanitized;
};
