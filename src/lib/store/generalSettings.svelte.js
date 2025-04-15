// @alias generalSettings.isConfetti bool
// @alias generalSettings.isAllowPause bool
// @alias generalSettings.isShowGiveUp bool

// Configuration flag to determine storage method
export const isDebug = import.meta.env.DEV; // Set this based on your debug environment

function createGeneralSettings() {
	let isConfetti = $state(true);
	let isAllowPause = $state(true);
	let isShowGiveUp = $state(true);
	// let isHardMode = $state(false);

	return {
		get isConfetti() {
			return isConfetti;
		},
		set isConfetti(value) {
			isConfetti = value;
			this.save();
		},
		get isAllowPause() {
			return isAllowPause
		},
		set isAllowPause(value) {
			isAllowPause = value;
			this.save();
		},
		get isShowGiveUp() {
			return isShowGiveUp
		},
		set isShowGiveUp(value) {
			isShowGiveUp = value;
			this.save();
		},
		load: () => {
			if (isDebug) {
				const savedIsConfetti = localStorage.getItem('isConfetti');
				const savedIsAllowPause = localStorage.getItem('isAllowPause');
				const savedIsShowGiveUp = localStorage.getItem('isShowGiveUp');

				if (savedIsConfetti) {
					isConfetti = JSON.parse(savedIsConfetti);
				} else {
					isConfetti = true
				}
				if (savedIsAllowPause) {
					isAllowPause = JSON.parse(savedIsAllowPause);
				} else {
					isAllowPause = true
				}
				if (savedIsShowGiveUp) {
					isShowGiveUp = JSON.parse(savedIsShowGiveUp);
				} else {
					isShowGiveUp = false
				}
			} else {
				chrome.storage.local.get(['isConfetti', 'isAllowPause', 'isShowGiveUp'], (result) => {
					if (result.isConfetti) {
						isConfetti = result.isConfetti;
					} else {
						isConfetti = true
					}
					if (result.isAllowPause) {
						isAllowPause = result.isAllowPause;
					} else {
						isAllowPause = true
					}
					if (result.isShowGiveUp) {
						isShowGiveUp = result.isShowGiveUp;
					} else {
						isShowGiveUp = true
					}
				});
			}
		},
		save: () => {
			if (isDebug) {
				localStorage.setItem('isConfetti', JSON.stringify(isConfetti));
				localStorage.setItem('isAllowPause', JSON.stringify(isAllowPause));
				localStorage.setItem('isShowGiveUp', JSON.stringify(isShowGiveUp));
			} else {
				chrome.storage.local.set({ isConfetti: isConfetti, isAllowPause: isAllowPause, isShowGiveUp: isShowGiveUp });
			}
		},
	};
}

const generalSettingsStore = createGeneralSettings();
export default generalSettingsStore;
