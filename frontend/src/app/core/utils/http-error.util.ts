import { HttpErrorResponse } from '@angular/common/http';

type ErrorBody = {
  message?: string | string[];
  errors?: Array<{ message?: string; msg?: string } | string>;
  error?: {
    message?: string;
  };
};

export function extractErrorMessage(error: HttpErrorResponse): string {
  const payload = error.error as ErrorBody | string | string[] | null;

  if (typeof payload === 'string') {
    return payload;
  }

  if (Array.isArray(payload)) {
    return payload.join('. ');
  }

  if (Array.isArray(payload?.message)) {
    return payload.message.join('. ');
  }

  if (typeof payload?.message === 'string' && payload.message.trim().length > 0) {
    return payload.message;
  }

  if (Array.isArray(payload?.errors)) {
    const message = payload.errors
      .map((item) => {
        if (typeof item === 'string') {
          return item;
        }

        return item.message ?? item.msg ?? '';
      })
      .filter((item) => item.trim().length > 0)
      .join('. ');

    if (message.length > 0) {
      return message;
    }
  }

  return (
    payload?.error?.message ??
    error.message ??
    'Request failed. Please try again.'
  );
}
