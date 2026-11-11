<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { useConsent } from '~/composables/useConsent'

const {
  consentStatus,
  consentUpdatedAt,
  isBannerVisible,
  isPreferencesOpen,
  acceptAnalytics,
  rejectAnalytics,
  updateConsent,
  openPreferences,
  closePreferences
} = useConsent()

const preferencesDialogRef = ref<HTMLDialogElement | null>(null)
const analyticsToggle = ref(false)

watch(
  isPreferencesOpen,
  async (open) => {
    if (!import.meta.client) {
      return
    }
    if (open) {
      analyticsToggle.value = consentStatus.value === 'granted'
      await nextTick()
      const dialog = preferencesDialogRef.value
      if (dialog && !dialog.open) {
        dialog.showModal()
      }
    } else {
      const dialog = preferencesDialogRef.value
      if (dialog && dialog.open) {
        dialog.close()
      }
    }
  },
  { immediate: true }
)

const handleNativeDialogClose = () => {
  if (isPreferencesOpen.value) {
    closePreferences()
  }
}

const handleDialogBackdropClick = (event: MouseEvent) => {
  const dialog = preferencesDialogRef.value
  if (!dialog || event.target !== dialog) {
    return
  }
  const rect = dialog.getBoundingClientRect()
  const clickedInside = (
    event.clientX >= rect.left
    && event.clientX <= rect.right
    && event.clientY >= rect.top
    && event.clientY <= rect.bottom
  )
  if (!clickedInside) {
    closePreferences()
  }
}

const handleSavePreferences = () => {
  updateConsent(analyticsToggle.value ? 'granted' : 'denied', 'preferences')
}
</script>

<template>
  <ClientOnly>
    <div>
      <!-- Non-blocking GDPR Consent Banner (Equal visual prominence, zero dark patterns) -->
      <section
        v-if="isBannerVisible"
        aria-label="Analytics and privacy consent"
        role="region"
        class="fixed bottom-4 inset-x-4 sm:left-auto sm:right-6 sm:max-w-lg z-40"
      >
        <div class="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl p-5 space-y-4">
          <div class="flex items-start gap-3">
            <div class="p-2 rounded-xl bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 shrink-0 mt-0.5">
              <UIcon
                name="i-lucide-shield-check"
                class="w-5 h-5"
              />
            </div>
            <div class="space-y-1.5 text-sm">
              <h2 class="font-bold text-gray-900 dark:text-white text-base leading-snug">
                Privacy &amp; Analytics Preferences
              </h2>
              <p class="text-gray-600 dark:text-gray-300 leading-relaxed">
                DuoSigna uses essential storage for sign-in sessions and theme settings. With your permission, we also use privacy-safe Google Analytics 4 metrics (zero emails, prompts, or webcam data) to improve sign lessons and quizzes.
              </p>
            </div>
          </div>

          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 pt-1">
            <UButton
              type="button"
              color="neutral"
              variant="ghost"
              size="sm"
              class="font-semibold justify-center sm:justify-start"
              @click="openPreferences"
            >
              Manage Preferences
            </UButton>

            <div class="flex flex-col sm:flex-row gap-2">
              <UButton
                type="button"
                color="neutral"
                variant="outline"
                size="md"
                class="font-bold justify-center"
                @click="rejectAnalytics('banner')"
              >
                Reject Non-Essential
              </UButton>
              <UButton
                type="button"
                color="primary"
                variant="solid"
                size="md"
                class="font-bold justify-center"
                @click="acceptAnalytics('banner')"
              >
                Accept Analytics
              </UButton>
            </div>
          </div>
        </div>
      </section>

      <!-- Native HTML <dialog> for granular Consent Preferences -->
      <dialog
        ref="preferencesDialogRef"
        aria-labelledby="duosigna-consent-dialog-title"
        closedby="any"
        class="consent-dialog m-auto w-[calc(100%-2rem)] max-w-lg rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-0 shadow-2xl"
        @close="handleNativeDialogClose"
        @click="handleDialogBackdropClick"
      >
        <div class="divide-y divide-gray-200 dark:divide-gray-800">
          <div class="flex items-center justify-between px-6 py-4">
            <div class="flex items-center gap-2.5">
              <UIcon
                name="i-lucide-sliders-horizontal"
                class="w-5 h-5 text-primary-600 dark:text-primary-400"
              />
              <h3
                id="duosigna-consent-dialog-title"
                class="text-lg font-extrabold text-gray-900 dark:text-white"
              >
                Privacy &amp; Cookie Settings
              </h3>
            </div>
            <UButton
              type="button"
              color="neutral"
              variant="ghost"
              icon="i-lucide-x"
              aria-label="Close privacy preferences"
              @click="closePreferences"
            />
          </div>

          <div class="px-6 py-5 space-y-5 text-sm">
            <p class="text-gray-600 dark:text-gray-300 leading-relaxed">
              Manage how DuoSigna measures product interactions via Google Consent Mode v2. You can change your choice at any time from the footer or Settings.
            </p>

            <!-- Strictly Necessary -->
            <div class="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40 flex items-start justify-between gap-4">
              <div class="space-y-1">
                <div class="flex items-center gap-2">
                  <span class="font-bold text-gray-900 dark:text-white">Strictly Necessary Storage</span>
                  <UBadge
                    color="primary"
                    variant="soft"
                    size="xs"
                  >
                    Always On
                  </UBadge>
                </div>
                <p class="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  Required for JWT authentication sessions, UI sidebar state, theme colors, and remembering your consent choice.
                </p>
              </div>
              <USwitch
                :model-value="true"
                disabled
                aria-label="Strictly necessary storage always enabled"
              />
            </div>

            <!-- Optional Analytics -->
            <div class="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-start justify-between gap-4">
              <div class="space-y-1">
                <div class="flex items-center gap-2">
                  <span class="font-bold text-gray-900 dark:text-white">Analytics &amp; Learning Telemetry</span>
                  <UBadge
                    :color="analyticsToggle ? 'primary' : 'neutral'"
                    variant="soft"
                    size="xs"
                  >
                    {{ analyticsToggle ? 'Enabled' : 'Disabled' }}
                  </UBadge>
                </div>
                <p class="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  Enables anonymized Google Analytics 4 event measurement (navigation, quiz progress, camera recognition latency). Emails, prompts, and camera video/landmarks are never collected. Advertising storage remains denied.
                </p>
              </div>
              <USwitch
                v-model="analyticsToggle"
                color="primary"
                aria-label="Enable analytics and learning telemetry"
              />
            </div>

            <div class="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-between pt-1">
              <span>Current status: <strong class="uppercase">{{ consentStatus }}</strong></span>
              <span v-if="consentUpdatedAt">Updated: {{ new Date(consentUpdatedAt).toLocaleDateString() }}</span>
            </div>
          </div>

          <div class="px-6 py-4 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2.5 bg-gray-50/70 dark:bg-gray-950/40">
            <UButton
              type="button"
              color="neutral"
              variant="outline"
              size="md"
              class="font-bold justify-center"
              @click="rejectAnalytics('preferences')"
            >
              Reject Non-Essential
            </UButton>
            <div class="flex flex-col sm:flex-row gap-2">
              <UButton
                type="button"
                color="primary"
                variant="solid"
                size="md"
                class="font-bold justify-center"
                @click="handleSavePreferences"
              >
                Save Preferences
              </UButton>
            </div>
          </div>
        </div>
      </dialog>
    </div>
  </ClientOnly>
</template>

<style scoped>
.consent-dialog {
  overscroll-behavior: contain;
}

.consent-dialog::backdrop {
  background-color: rgba(3, 7, 18, 0.6);
  backdrop-filter: blur(4px);
}
</style>
