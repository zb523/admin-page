// User profile from the server
export interface UserProfile {
  id: string
  slug: string
  name: string
  is_live: boolean
  current_room_name: string | null
  input_lang: string
  output_langs: string[]
  created_at: string
}

// Session record
export interface Session {
  id: string
  room_name: string
  title: string | null
  input_lang: string
  output_langs: string[]
  is_live: boolean
  created_at: string
  ended_at: string | null
}

// Session list item (same as Session for now)
export type SessionListItem = Session

// API request types
export interface CreateUserRequest {
  slug: string
  name: string
  input_lang?: string
  output_langs?: string[]
}

export interface UpdateUserRequest {
  name?: string
  input_lang?: string
  output_langs?: string[]
}

export interface StartSessionRequest {
  input_lang?: string
  output_langs?: string[]
}

export interface UpdateSessionRequest {
  title?: string
}

// API response types
export interface StartSessionResponse {
  session_id: string
  room_name: string
  token: string
}

export interface StopSessionResponse {
  success: boolean
  session_id: string
}

export interface SessionsListResponse {
  sessions: SessionListItem[]
}

export interface UserMeResponse extends UserProfile {}

export interface ErrorResponse {
  error: string
  needs_onboarding?: boolean
  session_id?: string // returned on 409 when session already exists
}

// Transcript types for history detail
export interface TranscriptWithTranslations {
  sequence_id: number
  source_text: string
  context_snapshot: Record<string, unknown> | null
  translations: Record<string, string>
}

export interface SessionHistoryResponse {
  session: {
    id: string
    room_name: string
    title: string | null
    input_lang: string
    output_langs: string[]
    is_live: boolean
    created_at: string
    ended_at: string | null
  }
  user: {
    slug: string
    name: string
  }
  transcripts: TranscriptWithTranslations[]
}

// Glossary term for Speechmatics custom dictionary
export interface GlossaryTerm {
  id: string
  user_id: string
  content: string
  sounds_like: string[]
  language: string
  created_at: string
}

// Gemini extraction response
export interface GlossaryExtractionResponse {
  detected_language: string
  terms: Array<{
    content: string
    sounds_like: string[]
  }>
}

// Language options
export const SUPPORTED_LANGUAGES: Record<string, string> = {
  ar: 'Arabic',
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  tr: 'Turkish',
  ur: 'Urdu',
  id: 'Indonesian',
  ms: 'Malay',
  sw: 'Swahili',
}
