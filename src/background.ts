chrome.action.onClicked.addListener(start);
chrome.runtime.onMessage.addListener(listener)

const tabIdWindowIdMap: Record<number, number> = {}

async function start() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
  const currentTab = tabs[0];
  tabIdWindowIdMap[currentTab.id] = currentTab.windowId
  console.log('record', tabIdWindowIdMap)

  const { top, height, width, left } = await chrome.windows.get(currentTab.windowId)
  await chrome.windows.create({
    type: 'popup',
    tabId: currentTab.id,
    top, left, height, width
  })
}

async function listener(message) {
  console.log('received message:', message)

  if (message !== 'reset') {
    throw new Error('unknown message: [message]:' + message)
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

  try {
    if (!tabIdWindowIdMap[tab.id]) {
      throw new Error('windowId not found')
    }
    if (!await chrome.windows.get(tabIdWindowIdMap[tab.id])) {
      throw new Error('window not found')
    }
    await chrome.tabs.move(tab.id!, { windowId: tabIdWindowIdMap[tab.id], index: -1 })
    console.log('move succeed')
  } catch (error) {
    console.log('原窗口可能被销毁，创建新窗口后尝试')
    const { top, height, width, left } = await chrome.windows.get(tab.windowId)
    await chrome.windows.create({
      type: 'normal',
      tabId: tab.id,
      top, height, width, left,
    })
    console.log('move succeed')
  }

  console.log('remove record [tabId]: ', tab.id)
  delete tabIdWindowIdMap[tab.id]

  await chrome.tabs.update(
    tab.id!,
    { active: true }
  )
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