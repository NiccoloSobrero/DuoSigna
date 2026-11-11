import type {
  ConsentDecision,
  ConsentSource,
  ConsentStatus,
  StoredConsentPreference
} from '~/types/analytics'

const CONSENT_STORAGE_KEY = 'duosigna-consent-v1'

const isAnalyticsDebugEnabled = (): boolean => {
  const config = useRuntimeConfig()
  const flag = config.public?.analyticsDebug as boolean | string | undefined
  return flag === true || flag === 'true'
}

const readStoredConsent = (): StoredConsentPreference | null => {
  if (!import.meta.client) {
    return null
  }
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY)
    if (!raw) {
      return null
    }
    const parsed = JSON.parse(raw) as Partial<StoredConsentPreference>
    if (
      parsed
      && parsed.version === 1
      && (parsed.analytics_storage === 'granted' || parsed.analytics_storage === 'denied')
    ) {
      return {
        version: 1,
        analytics_storage: parsed.analytics_storage,
        updated_at: typeof parsed.updated_at === 'string' ? parsed.updated_at : new Date().toISOString()
      }
    }
    return null
  } catch {
    return null
  }
}

const persistConsent = (decision: ConsentDecision): string | null => {
  if (!import.meta.client) {
    return null
  }
  const updatedAt = new Date().toISOString()
  const record: StoredConsentPreference = {
    version: 1,
    analytics_storage: decision,
    updated_at: updatedAt
  }
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(record))
  } catch {
    // Ignore storage errors in restricted browsing modes
  }
  return updatedAt
}

const applyGtagConsentUpdate = (decision: ConsentDecision, source: ConsentSource): void => {
  if (!import.meta.client) {
    return
  }
  try {
    window.dataLayer = window.dataLayer || []

    const consentPayload = {
      analytics_storage: decision,
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied'
    }

    if (typeof window.gtag === 'function') {
      window.gtag('consent', 'update', consentPayload)
    } else {
      window.dataLayer.push(['consent', 'update', consentPayload] as unknown as Record<string, unknown>)
    }

    const eventPayload = {
      event: 'consent_updated',
      consent_analytics: decision,
      consent_source: source
    }
    window.dataLayer.push(eventPayload)

    if (isAnalyticsDebugEnabled()) {
      console.info('[DuoSigna Consent]', eventPayload, consentPayload)
    }
  } catch {
    // Fail silently if global dataLayer access is blocked
  }
}

export const useConsent = () => {
  const consentStatus = useState<ConsentStatus>('duosigna-consent-status', () => 'unset')
  const consentUpdatedAt = useState<string | null>('duosigna-consent-updated-at', () => null)
  const isBannerVisible = useState<boolean>('duosigna-consent-banner-visible', () => false)
  const isPreferencesOpen = useState<boolean>('duosigna-consent-preferences-open', () => false)

  const initStoredConsent = (): ConsentStatus => {
    if (!import.meta.client) {
      return consentStatus.value
    }

    const stored = readStoredConsent()
    if (stored) {
      consentStatus.value = stored.analytics_storage
      consentUpdatedAt.value = stored.updated_at
      isBannerVisible.value = false
      applyGtagConsentUpdate(stored.analytics_storage, 'stored')
      return stored.analytics_storage
    }

    consentStatus.value = 'unset'
    consentUpdatedAt.value = null
    isBannerVisible.value = true
    return 'unset'
  }

  const updateConsent = (decision: ConsentDecision, source: ConsentSource = 'banner'): void => {
    consentStatus.value = decision
    consentUpdatedAt.value = persistConsent(decision)
    isBannerVisible.value = false
    isPreferencesOpen.value = false
    applyGtagConsentUpdate(decision, source)
  }

  const acceptAnalytics = (source: ConsentSource = 'banner'): void => {
    updateConsent('granted', source)
  }

  const rejectAnalytics = (source: ConsentSource = 'banner'): void => {
    updateConsent('denied', source)
  }

  const openPreferences = (): void => {
    isPreferencesOpen.value = true
  }

  const closePreferences = (): void => {
    isPreferencesOpen.value = false
  }

  return {
    consentStatus,
    consentUpdatedAt,
    isBannerVisible,
    isPreferencesOpen,
    initStoredConsent,
    updateConsent,
    acceptAnalytics,
    rejectAnalytics,
    openPreferences,
    closePreferences
  }
}
