chrome.action.onClicked.addListener(start);

const tabIdWindowIdMap: Record<number, number> = {}
let listener: any = undefined

async function start() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
  const currentTab = tabs[0];
  tabIdWindowIdMap[currentTab.id] = currentTab.windowId

  await chrome.windows.create({
    type: 'popup',
    tabId: currentTab.id
  })

  if (!listener) {
    listener = async (message) => {
      console.log('received message:', message)

      if (message !== 'reset') { return }

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      if (!tabIdWindowIdMap[tab.id]) { return }

      chrome.tabs.move(tab.id!, { windowId: tabIdWindowIdMap[tab.id], index: -1 })
      chrome.tabs.update(
        tab.id!,
        { active: true }
      )

      delete tabIdWindowIdMap[tab.id]

      if (Object.keys(tabIdWindowIdMap).length === 0) {
        chrome.runtime.onMessage.removeListener(listener)
        listener = undefined
      }
    }
    chrome.runtime.onMessage.addListener(listener)
  }
}

chrome.tabs.onAttached.addListener(async (tabId, attachInfo) => {
  if (!tabIdWindowIdMap[tabId]) { return }
  attachElementAndStyle(tabId)
})

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (!tabIdWindowIdMap[tabId]) { return }
  attachElementAndStyle(tabId)
})

chrome.tabs.onRemoved.addListener(async (tabId, removeInfo) => {
  if (!tabIdWindowIdMap[tabId]) { return }
  delete tabIdWindowIdMap[tabId]
})

function attachElementAndStyle(tabId: number) {
  chrome.scripting.executeScript({
    target: { tabId },
    world: 'ISOLATED',
    files: ['/dist/ui.js']
  })
}