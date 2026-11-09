export const REQUEST_WINDOW_SIZE_STORAGE_KEY = 'hawkbitgui.request-window-size';

export const REQUEST_WINDOW_MIN_WIDTH = 180;
export const REQUEST_WINDOW_MAX_WIDTH = 420;
export const REQUEST_WINDOW_MIN_HEIGHT = 140;
export const REQUEST_WINDOW_MAX_HEIGHT = 640;

export const DEFAULT_REQUEST_WINDOW_SIZE = { width: 201, height: 320 };

export type RequestWindowSize = {
  width: number;
  height: number;
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export function clampRequestWindowSize(size: Partial<RequestWindowSize> | null | undefined): RequestWindowSize {
  const width = Number.isFinite(size?.width) ? Number(size?.width) : DEFAULT_REQUEST_WINDOW_SIZE.width;
  const height = Number.isFinite(size?.height) ? Number(size?.height) : DEFAULT_REQUEST_WINDOW_SIZE.height;

  return {
    width: Math.round(clamp(width, REQUEST_WINDOW_MIN_WIDTH, REQUEST_WINDOW_MAX_WIDTH)),
    height: Math.round(clamp(height, REQUEST_WINDOW_MIN_HEIGHT, REQUEST_WINDOW_MAX_HEIGHT)),
  };
}

export function parseRequestWindowSize(raw: string | null | undefined): RequestWindowSize {
  if (!raw) {
    return DEFAULT_REQUEST_WINDOW_SIZE;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<RequestWindowSize>;
    return clampRequestWindowSize(parsed);
  } catch {
    return DEFAULT_REQUEST_WINDOW_SIZE;
  }
}

export function serializeRequestWindowSize(size: RequestWindowSize): string {
  const clamped = clampRequestWindowSize(size);
  return JSON.stringify(clamped);
}

export function resizeRequestWindowSize(start: RequestWindowSize, deltaX: number, deltaY: number): RequestWindowSize {
  return clampRequestWindowSize({ width: start.width + deltaX, height: start.height + deltaY });
}
