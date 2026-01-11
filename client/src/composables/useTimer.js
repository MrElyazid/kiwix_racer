import { ref, computed } from "vue";
import { formatMsToMinutesSeconds } from "@/utils/graphHelpers";

/**
 * Composable for timer functionality
 * Provides start, stop, reset functionality and formatted time display
 */
export function useTimer() {
  const timerStart = ref(null);
  const elapsedMs = ref(0);
  let timerIntervalId = null;

  const isRunning = computed(() => timerStart.value !== null);
  const formattedTime = computed(() => formatMsToMinutesSeconds(elapsedMs.value));

  /**
   * Start the timer
   */
  function start() {
    if (timerStart.value) return;
    timerStart.value = Date.now();
    elapsedMs.value = 0;
    timerIntervalId = setInterval(() => {
      elapsedMs.value = Date.now() - timerStart.value;
    }, 100);
  }

  /**
   * Stop the timer and record final time
   */
  function stop() {
    if (timerIntervalId) {
      clearInterval(timerIntervalId);
      timerIntervalId = null;
    }
    if (timerStart.value) {
      elapsedMs.value = Date.now() - timerStart.value;
    }
    timerStart.value = null;
  }

  /**
   * Reset the timer to initial state
   */
  function reset() {
    stop();
    elapsedMs.value = 0;
  }

  /**
   * Cleanup timer on component unmount
   */
  function cleanup() {
    if (timerIntervalId) {
      clearInterval(timerIntervalId);
      timerIntervalId = null;
    }
  }

  return {
    // State
    elapsedMs,
    isRunning,
    formattedTime,

    // Methods
    start,
    stop,
    reset,
    cleanup,
  };
}
