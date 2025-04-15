let isDarkMode = $state(true)

function getIsDarkMode() {
	return isDarkMode
}

function setIsDarkMode(value) {
	isDarkMode = value
}

export { getIsDarkMode, setIsDarkMode }
