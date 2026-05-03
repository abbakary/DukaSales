import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { getApiBaseUrl } from './api/client'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getFullImageUrl(path: string | null | undefined) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${getApiBaseUrl()}${path}`;
}
