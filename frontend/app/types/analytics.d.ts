export type ConsentDecision = 'granted' | 'denied'
export type ConsentStatus = 'unset' | ConsentDecision
export type ConsentSource = 'banner' | 'preferences' | 'settings' | 'stored'

export interface StoredConsentPreference {
  version: 1
  analytics_storage: ConsentDecision
  updated_at: string
}

export interface VirtualPageViewPayload {
  page_path: string
  page_title: string
}

export interface AuthCompletedPayload {
  action: 'login' | 'register'
}

export interface OnboardingTourActionPayload {
  status: 'completed' | 'skipped'
  step_reached: number
}

export interface TutorInteractionPayload {
  input_mode: 'text' | 'voice'
  tts_active: boolean
  intent_purpose: 'translation' | 'general' | 'error'
  sign_level: 'level_0' | 'level_1' | 'level_2' | 'none'
}

export interface CameraPracticeResultPayload {
  context: 'tutor' | 'quiz'
  target_type: 'letter' | 'word'
  passed: boolean
  confidence_pct: number
  latency_ms: number
}

export interface DictionarySignViewedPayload {
  category: string
  sign_name: string
  is_unlocked: boolean
}

export interface DictionarySignUnlockedPayload {
  category: string
  sign_name: string
}

export interface QuizStartedPayload {
  categories_count: number
  is_mixed: boolean
  question_count: number
}

export interface QuizCompletedPayload {
  categories_count: number
  score_percent: number
  hints_used: number
  question_count: number
}

export interface ConsentUpdatedPayload {
  consent_analytics: ConsentDecision
  consent_source: ConsentSource
}

export interface DuoSignaAnalyticsEventMap {
  virtual_page_view: VirtualPageViewPayload
  auth_completed: AuthCompletedPayload
  onboarding_tour_action: OnboardingTourActionPayload
  tutor_interaction: TutorInteractionPayload
  camera_practice_result: CameraPracticeResultPayload
  dictionary_sign_viewed: DictionarySignViewedPayload
  dictionary_sign_unlocked: DictionarySignUnlockedPayload
  quiz_started: QuizStartedPayload
  quiz_completed: QuizCompletedPayload
  consent_updated: ConsentUpdatedPayload
}

export type DataLayerEntry = Record<string, unknown> | IArguments

declare global {
  interface Window {
    dataLayer: DataLayerEntry[]
    gtag?: (...args: unknown[]) => void
  }
}
