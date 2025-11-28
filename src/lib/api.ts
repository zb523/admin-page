import { getAccessToken } from './supabase'
import type {
  UserMeResponse,
  CreateUserRequest,
  UpdateUserRequest,
  StartSessionRequest,
  StartSessionResponse,
  StopSessionResponse,
  SessionsListResponse,
  UpdateSessionRequest,
  Session,
  SessionHistoryResponse,
  ErrorResponse,
} from '@/types'

const API_URL = import.meta.env.VITE_API_URL

if (!API_URL) {
  throw new Error('Missing VITE_API_URL environment variable')
}

class ApiError extends Error {
  status: number
  data: ErrorResponse

  constructor(status: number, data: ErrorResponse) {
    super(data.error || 'API Error')
    this.status = status
    this.data = data
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAccessToken()
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (token) {
    ;(headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  })

  const data = await response.json()

  if (!response.ok) {
    throw new ApiError(response.status, data as ErrorResponse)
  }

  return data as T
}

// User endpoints
export async function getMe(): Promise<UserMeResponse> {
  return request<UserMeResponse>('/api/users/me')
}

export async function createProfile(data: CreateUserRequest): Promise<UserMeResponse> {
  return request<UserMeResponse>('/api/users/me', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateProfile(data: UpdateUserRequest): Promise<UserMeResponse> {
  return request<UserMeResponse>('/api/users/me', {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

// Session endpoints
export async function getMySessions(): Promise<SessionsListResponse> {
  return request<SessionsListResponse>('/api/sessions/mine')
}

export async function startSession(data?: StartSessionRequest): Promise<StartSessionResponse> {
  return request<StartSessionResponse>('/api/sessions/start', {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  })
}

export async function stopSession(): Promise<StopSessionResponse> {
  return request<StopSessionResponse>('/api/sessions/stop', {
    method: 'POST',
  })
}

export async function updateSession(
  sessionId: string,
  data: UpdateSessionRequest
): Promise<Session> {
  return request<Session>(`/api/sessions/${sessionId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function deleteSession(
  sessionId: string
): Promise<{ success: boolean; deleted_id: string }> {
  return request<{ success: boolean; deleted_id: string }>(
    `/api/sessions/${sessionId}`,
    { method: 'DELETE' }
  )
}

// Public endpoints (no auth required but we send it anyway)
export async function getSessionHistory(
  sessionId: string
): Promise<SessionHistoryResponse> {
  return request<SessionHistoryResponse>(`/api/sessions/${sessionId}/history`)
}

// Export the error class for type checking
export { ApiError }

