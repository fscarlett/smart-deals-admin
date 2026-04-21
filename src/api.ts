const rawApiBaseUrl = import.meta.env.VITE_SMART_DEALS_API_URL

export const API_BASE_URL = rawApiBaseUrl.replace(/\/$/, '')

export function buildApiUrl(path: string) {
  const normalizedPath = path.replace(/^\//, '')

  return `${API_BASE_URL}/${normalizedPath}`
}
