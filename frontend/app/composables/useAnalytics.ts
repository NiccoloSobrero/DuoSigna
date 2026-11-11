import type {
  AuthCompletedPayload,
  CameraPracticeResultPayload,
  DictionarySignUnlockedPayload,
  DictionarySignViewedPayload,
  DuoSignaAnalyticsEventMap,
  OnboardingTourActionPayload,
  QuizCompletedPayload,
  QuizStartedPayload,
  TutorInteractionPayload
} from '~/types/analytics'

type AnalyticsEventName = keyof DuoSignaAnalyticsEventMap

const ALLOWED_KEYS: Record<AnalyticsEventName, readonly string[]> = {
  virtual_page_view: ['page_path', 'page_title'],
  auth_completed: ['action'],
  onboarding_tour_action: ['status', 'step_reached'],
  tutor_interaction: ['input_mode', 'tts_active', 'intent_purpose', 'sign_level'],
  camera_practice_result: ['context', 'target_type', 'passed', 'confidence_pct', 'latency_ms'],
  dictionary_sign_viewed: ['category', 'sign_name', 'is_unlocked'],
  dictionary_sign_unlocked: ['category', 'sign_name'],
  quiz_started: ['categories_count', 'is_mixed', 'question_count'],
  quiz_completed: ['categories_count', 'score_percent', 'hints_used', 'question_count'],
  consent_updated: ['consent_analytics', 'consent_source']
}

const BLOCKED_PII_KEYS = new Set([
  'email',
  'nome',
  'name',
  'full_name',
  'username',
  'password',
  'old_password',
  'new_password',
  'token',
  'access_token',
  'jwt',
  'authorization',
  'prompt',
  'question',
  'answer',
  'content',
  'message',
  'frames',
  'landmarks',
  'user_id',
  'userid',
  'avatar_url',
  'chat_id'
])

const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i
const JWT_PATTERN = /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/
const BEARER_PATTERN = /\bBearer\s+[A-Za-z0-9._-]+/i
const PERCENT_KEYS = new Set(['confidence_pct', 'score_percent'])

const isAnalyticsDebug = (): boolean => {
  const config = useRuntimeConfig()
  const flag = config.public?.analyticsDebug as boolean | string | undefined
  return flag === true || flag === 'true'
}

const sanitizeStringValue = (key: string, value: string, debug: boolean): string => {
  const trimmed = value.trim()
  if (EMAIL_PATTERN.test(trimmed) || JWT_PATTERN.test(trimmed) || BEARER_PATTERN.test(trimmed)) {
    if (debug) {
      console.warn(`[DuoSigna Analytics] Redacted potential PII in field "${key}".`)
    }
    return '[REDACTED]'
  }

  if (key === 'page_path') {
    const cleanPath = (trimmed.split('?')[0] || '/').split('#')[0] || '/'
    return cleanPath.slice(0, 120)
  }

  if (key === 'sign_name') {
    return trimmed.toLowerCase().slice(0, 60)
  }

  return trimmed.slice(0, 120)
}

const sanitizePayload = <K extends AnalyticsEventName>(
  eventName: K,
  rawPayload: DuoSignaAnalyticsEventMap[K],
  debug: boolean
): Record<string, string | number | boolean> => {
  const allowed = new Set(ALLOWED_KEYS[eventName] || [])
  const sanitized: Record<string, string | number | boolean> = {}

  for (const [key, value] of Object.entries(rawPayload as unknown as Record<string, unknown>)) {
    const normalizedKey = key.toLowerCase()
    if (BLOCKED_PII_KEYS.has(normalizedKey)) {
      if (debug) {
        console.warn(`[DuoSigna Analytics] Blocked PII key "${key}" on event "${eventName}".`)
      }
      continue
    }

    if (!allowed.has(key)) {
      if (debug) {
        console.warn(`[DuoSigna Analytics] Dropped unexpected key "${key}" on event "${eventName}".`)
      }
      continue
    }

    if (typeof value === 'string') {
      sanitized[key] = sanitizeStringValue(key, value, debug)
    } else if (typeof value === 'number' && Number.isFinite(value)) {
      let rounded = Math.max(0, Math.round(value))
      if (PERCENT_KEYS.has(key)) {
        rounded = Math.min(100, rounded)
      }
      sanitized[key] = rounded
    } else if (typeof value === 'boolean') {
      sanitized[key] = value
    }
  }

  return sanitized
}

export const useAnalytics = () => {
  const trackEvent = <K extends AnalyticsEventName>(
    eventName: K,
    payload: DuoSignaAnalyticsEventMap[K]
  ): void => {
    if (!import.meta.client) {
      return
    }

    const debug = isAnalyticsDebug()
    const cleanPayload = sanitizePayload(eventName, payload, debug)
    const entry = {
      event: eventName,
      ...cleanPayload
    }

    if (debug) {
      console.info(`[DuoSigna Analytics] ${eventName}`, cleanPayload)
    }

    try {
      window.dataLayer = window.dataLayer || []
      window.dataLayer.push(entry)
    } catch {
      // Fail silently if window.dataLayer is unavailable or blocked
    }
  }

  const trackPageView = (pagePath: string, pageTitle: string): void => {
    trackEvent('virtual_page_view', {
      page_path: pagePath || '/',
      page_title: pageTitle || 'DuoSigna'
    })
  }

  const trackAuthCompleted = (action: AuthCompletedPayload['action']): void => {
    trackEvent('auth_completed', { action })
  }

  const trackOnboardingTour = (
    status: OnboardingTourActionPayload['status'],
    stepReached: number
  ): void => {
    trackEvent('onboarding_tour_action', {
      status,
      step_reached: stepReached
    })
  }

  const trackTutorInteraction = (payload: TutorInteractionPayload): void => {
    trackEvent('tutor_interaction', payload)
  }

  const trackCameraPracticeResult = (payload: CameraPracticeResultPayload): void => {
    trackEvent('camera_practice_result', payload)
  }

  const trackDictionarySignViewed = (payload: DictionarySignViewedPayload): void => {
    trackEvent('dictionary_sign_viewed', payload)
  }

  const trackDictionarySignUnlocked = (payload: DictionarySignUnlockedPayload): void => {
    trackEvent('dictionary_sign_unlocked', payload)
  }

  const trackQuizStarted = (payload: QuizStartedPayload): void => {
    trackEvent('quiz_started', payload)
  }

  const trackQuizCompleted = (payload: QuizCompletedPayload): void => {
    trackEvent('quiz_completed', payload)
  }

  return {
    trackEvent,
    trackPageView,
    trackAuthCompleted,
    trackOnboardingTour,
    trackTutorInteraction,
    trackCameraPracticeResult,
    trackDictionarySignViewed,
    trackDictionarySignUnlocked,
    trackQuizStarted,
    trackQuizCompleted
  }
}
