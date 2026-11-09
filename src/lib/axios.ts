import axios, { InternalAxiosRequestConfig } from 'axios';
import { signOut } from 'next-auth/react';
import { useRequestLogStore } from '@/stores/request-log-store';
import { redactSensitiveText, summarizeHttpStatus } from '@/utils/redact';

const UNAUTHORIZED_CALLBACK_URL = '/login?error=unauthorized';
let isSigningOut = false;

type RequestLogConfig = InternalAxiosRequestConfig & {
  _requestLogId?: number;
  _requestLogStartedAt?: number;
};

const resolveRequestUrl = (config: InternalAxiosRequestConfig) => {
  return redactSensitiveText(`${config.baseURL ?? ''}${config.url ?? ''}`);
};

const finishRequestLog = (
  config: InternalAxiosRequestConfig | undefined,
  result: { state: 'success' | 'error'; status?: number; statusText?: string; summary: string; errorMessage?: string }
) => {
  const logConfig = config as RequestLogConfig | undefined;
  if (!logConfig?._requestLogId) {
    return;
  }
  useRequestLogStore.getState().finishRequest(logConfig._requestLogId, {
    ...result,
    durationMs: Date.now() - (logConfig._requestLogStartedAt ?? Date.now()),
  });
};

const signOutOnUnauthorized = () => {
  if (isSigningOut) {
    return;
  }

  isSigningOut = true;
  void signOut({ callbackUrl: UNAUTHORIZED_CALLBACK_URL });
};

const axiosInstance = axios.create({
  baseURL: '/api/hawkbit',
  headers: {
    Accept: 'application/json, application/hal+json',
  },
  withCredentials: true,
});

axiosInstance.interceptors.request.use((config) => {
  const logConfig = config as RequestLogConfig;
  logConfig._requestLogStartedAt = Date.now();
  logConfig._requestLogId = useRequestLogStore.getState().startRequest({
    method: config.method,
    url: resolveRequestUrl(config),
  });
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => {
    finishRequestLog(response.config, {
      state: 'success',
      status: response.status,
      statusText: response.statusText,
      summary: summarizeHttpStatus(response.status, response.statusText),
    });
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const errorMessage = error.response?.data?.message ?? error.message ?? 'Request failed';

    finishRequestLog(error.config, {
      state: 'error',
      status,
      statusText: error.response?.statusText,
      summary: redactSensitiveText(String(errorMessage)),
      errorMessage: redactSensitiveText(String(errorMessage)),
    });

    if (status === 401) {
      signOutOnUnauthorized();
    }
    if (error.response) {
      return Promise.reject(error.response.data);
    }

    return Promise.reject({
      exceptionClass: 'NetworkError',
      errorCode: error.code || 'UNKNOWN_ERROR',
      message: error.message || 'An unexpected error occurred',
    });
  }
);

export default axiosInstance;
