import { nextTick } from 'vue'
import { useConsent } from '~/composables/useConsent'
import { useAnalytics } from '~/composables/useAnalytics'

const GTM_SCRIPT_ELEMENT_ID = 'duosigna-gtm-script'
const GTM_ID_PATTERN = /^GTM-[A-Z0-9]+$/i

export default defineNuxtPlugin(() => {
  if (!import.meta.client) {
    return
  }

  const config = useRuntimeConfig()
  const rawGtmId = typeof config.public?.gtmId === 'string' ? config.public.gtmId.trim() : ''
  const analyticsDebugFlag = config.public?.analyticsDebug as boolean | string | undefined
  const isDebug = analyticsDebugFlag === true || analyticsDebugFlag === 'true'

  // 1. Initialize dataLayer and standard gtag() queue synchronously BEFORE GTM loads
  window.dataLayer = window.dataLayer || []
  if (typeof window.gtag !== 'function') {
    window.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer.push(arguments)
    }
  }

  // 2. Immediately set GDPR-safe Consent Mode v2 defaults before GTM starts
  window.gtag('consent', 'default', {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    wait_for_update: 500
  })
  window.gtag('set', 'ads_data_redaction', true)

  // 3. Rehydrate any previously saved consent decision BEFORE injecting GTM
  const { initStoredConsent } = useConsent()
  initStoredConsent()

  // 4. Inject GTM container script asynchronously & non-blockingly when configured
  if (GTM_ID_PATTERN.test(rawGtmId)) {
    if (!document.getElementById(GTM_SCRIPT_ELEMENT_ID)) {
      window.dataLayer.push({
        'gtm.start': Date.now(),
        'event': 'gtm.js'
      })

      const script = document.createElement('script')
      script.id = GTM_SCRIPT_ELEMENT_ID
      script.async = true
      script.setAttribute('fetchpriority', 'low')
      script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(rawGtmId)}`
      script.onerror = () => {
        if (isDebug) {
          console.info('[DuoSigna Analytics] GTM script blocked or unreachable; continuing without tracking.')
        }
      }
      document.head.appendChild(script)
    }
  } else if (isDebug) {
    console.info('[DuoSigna Analytics] NUXT_PUBLIC_GTM_ID is empty or invalid; GTM script injection skipped.')
  }

  // 5. Track SPA virtual pageviews cleanly without duplicate initial load hits
  const router = useRouter()
  const { trackPageView } = useAnalytics()

  let initialPageTracked = false
  let lastTrackedPath = ''

  const emitVirtualPageView = (path: string) => {
    const cleanPath = (path.split('?')[0] || '/').split('#')[0] || '/'
    if (cleanPath === lastTrackedPath) {
      return
    }
    lastTrackedPath = cleanPath
    trackPageView(cleanPath, document.title || 'DuoSigna')
  }

  router.isReady().then(() => {
    if (initialPageTracked) {
      return
    }
    initialPageTracked = true
    nextTick(() => {
      emitVirtualPageView(router.currentRoute.value.path)
    })
  })

  router.afterEach((to, from) => {
    if (!initialPageTracked || to.path === from.path) {
      return
    }
    nextTick(() => {
      emitVirtualPageView(to.path)
    })
  })
})
