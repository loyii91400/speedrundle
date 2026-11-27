browser.action.onClicked.addListener(() => {
  browser.sidebarAction.open().catch((error) => console.error(error));
});
