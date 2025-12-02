/**
 * Language Store
 * Manages the application language state
 */

import { defineStore } from 'pinia'

export const useLanguageStore = defineStore('language', {
  state: () => ({
    currentLanguage: localStorage.getItem('language') || 'en'
  }),
  
  actions: {
    setLanguage(lang) {
      this.currentLanguage = lang
      localStorage.setItem('language', lang)
      console.log(`Language changed to: ${lang}`)
    }
  },
  
  getters: {
    isEnglish: (state) => state.currentLanguage === 'en',
    isFrench: (state) => state.currentLanguage === 'fr'
  }
})
