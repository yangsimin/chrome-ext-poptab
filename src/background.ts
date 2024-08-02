chrome.action.onClicked.addListener(start);

async function start() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
  const currentTab = tabs[0];
  const lastWindowId = currentTab.windowId

  await chrome.windows.create({
    type: 'popup',
    tabId: currentTab.id
  })

  const listener = async (message) => {
    console.log('received message:', message)
    if (message !== 'reset') { return }
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (tab.id !== currentTab.id) { return }
    chrome.tabs.move(tab.id!, { windowId: lastWindowId, index: -1 })
    chrome.tabs.update(
      currentTab.id!,
      { active: true }
    )
    chrome.runtime.onMessage.removeListener(listener)
  }
  chrome.runtime.onMessage.addListener(listener)
}

chrome.tabs.onAttached.addListener(async (tabId, attachInfo) => {
  const window = await chrome.windows.get(attachInfo.newWindowId)
  if (window.type !== 'popup') { return }
  attachElementAndStyle(tabId)
})

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  const window = await chrome.windows.get(tab.windowId)
  if (window.type !== 'popup') { return }
  attachElementAndStyle(tabId)
})

function attachElementAndStyle(tabId: number) {
  chrome.scripting.executeScript({
    target: { tabId },
    world: 'ISOLATED',
    files: ['/dist/ui.js']
  })
}