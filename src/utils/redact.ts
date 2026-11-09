const REDACTED = '[REDACTED]';

const SENSITIVE_KEY_PATTERN = /(token|secret|password|passwd|pwd|api[-_]?key|authorization|credential|auth)/i;

const redactQueryValue = (url: string): string => {
  const [base, ...queryParts] = url.split('?');
  if (queryParts.length === 0) {
    return url;
  }

  const query = queryParts
    .join('?')
    .split('&')
    .map((part) => {
      const [rawKey, ...rawValue] = part.split('=');
      if (!rawKey || rawValue.length === 0) {
        return part;
      }
      const key = decodeURIComponent(rawKey.replace(/\+/g, ' '));
      const value = rawValue.join('=');
      if (SENSITIVE_KEY_PATTERN.test(key) && value !== '') {
        return `${rawKey}=${REDACTED}`;
      }
      return part;
    })
    .join('&');

  return `${base}?${query}`;
};

export const redactSensitiveText = (value: string): string => {
  let redacted = redactQueryValue(value);

  redacted = redacted.replace(/\b(Basic|Bearer)\s+[A-Za-z0-9._~+/=-]+/gi, `$1 ${REDACTED}`);
  redacted = redacted.replace(
    /((?:authorization|access[_-]?token|refresh[_-]?token|security[_-]?token|token|secret|password|passwd|pwd|api[-_]?key|credential)\s*[:=]\s*)([^\s,;&]+)/gi,
    `$1${REDACTED}`
  );
  redacted = redacted.replace(
    /(["']?(?:authorization|access[_-]?token|refresh[_-]?token|security[_-]?token|token|secret|password)["']?\s*[:=]\s*["'])([^"']+)(["'])/gi,
    `$1${REDACTED}$3`
  );

  return redacted;
};

export const summarizeHttpStatus = (status?: number, statusText?: string): string => {
  if (!status) {
    return 'No response';
  }
  const text = statusText?.trim();
  return text ? `${status} ${text}` : `${status}`;
};
