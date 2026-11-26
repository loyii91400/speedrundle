// @alias generalSettings.isConfetti bool
// @alias generalSettings.isAllowPause bool
// @alias generalSettings.isShowGiveUp bool

import { storageGet, storageSet } from './storage.js';

function createGeneralSettings() {
  let isConfetti = $state(true);
  let isAllowPause = $state(true);
  let isShowGiveUp = $state(true);

  return {
    get isConfetti() {
      return isConfetti;
    },
    /**
     * @param {boolean} value
     */
    set isConfetti(value) {
      isConfetti = value;
      this.save();
    },
    get isAllowPause() {
      return isAllowPause;
    },
    /**
     * @param {boolean} value
     */
    set isAllowPause(value) {
      isAllowPause = value;
      this.save();
    },
    get isShowGiveUp() {
      return isShowGiveUp;
    },
    /**
     * @param {boolean} value
     */
    set isShowGiveUp(value) {
      isShowGiveUp = value;
      this.save();
    },
    async load() {
      const result = await storageGet([
        'isConfetti',
        'isAllowPause',
        'isShowGiveUp',
      ]);
      // Use !== undefined: a stored `false` is a real value. The previous
      // truthiness check reset every "off" setting back to true on reload.
      if (result.isConfetti !== undefined) {
        isConfetti = result.isConfetti;
      }
      if (result.isAllowPause !== undefined) {
        isAllowPause = result.isAllowPause;
      }
      if (result.isShowGiveUp !== undefined) {
        isShowGiveUp = result.isShowGiveUp;
      }
    },
    save() {
      storageSet({ isConfetti, isAllowPause, isShowGiveUp });
    },
  };
}

const generalSettingsStore = createGeneralSettings();
export default generalSettingsStore;
