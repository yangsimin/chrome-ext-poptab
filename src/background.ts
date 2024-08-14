chrome.action.onClicked.addListener(start);
chrome.runtime.onMessage.addListener(listener)

interface TabFrame {
  urlRegex: RegExp
  frame: {
    top?: number
    left?: number
    width?: number
    height?: number
  }
}

const defaultTabFrames: TabFrame[] = [
  {
    urlRegex: /^https:\/\/weread\.qq\.com/,
    frame: {
      width: 700
    },
  }
]

async function start() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
  const currentTab = tabs[0];
  const tabIdWindowIdMap = await addTabId(currentTab.id, currentTab.windowId)
  console.log('record', tabIdWindowIdMap)

  const { top, height, width, left } = await chrome.windows.get(currentTab.windowId)
  const tabFrame = defaultTabFrames.find(({ urlRegex }) => urlRegex.test(currentTab.url))
  if (tabFrame) {
    await chrome.windows.create({
      type: 'popup',
      tabId: currentTab.id,
      top: tabFrame.frame.top ?? top,
      left: tabFrame.frame.left ?? left,
      height: tabFrame.frame.height ?? height,
      width: tabFrame.frame.width ?? width
    })
  } else {
    await chrome.windows.create({
      type: 'popup',
      tabId: currentTab.id,
      top, left, height, width
    })
  }
}

async function listener(message) {
  console.log('received message:', message)
  const tabIdWindowIdMap = await getTabIdWindowIdMap()

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
  deleteTabId(tab.id)

  await chrome.tabs.update(
    tab.id!,
    { active: true }
  )
}

chrome.tabs.onAttached.addListener(async (tabId, attachInfo) => {
  const tabIdWindowIdMap = await getTabIdWindowIdMap()
  console.log('attached', { tabIdWindowIdMap, tabId })
  if (!tabIdWindowIdMap[tabId]) { return }
  attachElementAndStyle(tabId)
})

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  const tabIdWindowIdMap = await getTabIdWindowIdMap()
  console.log('update', { tabIdWindowIdMap, tabId })
  if (!tabIdWindowIdMap[tabId]) { return }
  console.log('mount element')
  attachElementAndStyle(tabId)
})

chrome.tabs.onRemoved.addListener(async (tabId, removeInfo) => {
  const tabIdWindowIdMap = await getTabIdWindowIdMap()
  console.log('remove', { tabIdWindowIdMap, tabId })
  if (!tabIdWindowIdMap[tabId]) { return }
  deleteTabId(tabId)
})

function attachElementAndStyle(tabId: number) {
  chrome.scripting.executeScript({
    target: { tabId },
    world: 'ISOLATED',
    files: ['/dist/ui.js']
  })
}

const STORAGE_KEY = 'poptab'

async function deleteTabId(tabId: number) {
  const tabIdWindowIdMap = await getTabIdWindowIdMap()
  delete tabIdWindowIdMap[tabId]
  await setTabIdWindowIdMap(tabIdWindowIdMap)
}

async function addTabId(tabId: number, windowId: number) {
  const tabIdWindowIdMap = await getTabIdWindowIdMap()
  tabIdWindowIdMap[tabId] = windowId
  await setTabIdWindowIdMap(tabIdWindowIdMap)
  return tabIdWindowIdMap
}

async function getTabIdWindowIdMap() {
  const res = await chrome.storage.local.get({ [STORAGE_KEY]: {} })
  return res[STORAGE_KEY]
}

async function setTabIdWindowIdMap(tabIdWindowIdMap: Record<number, number>) {
  await chrome.storage.local.set({ [STORAGE_KEY]: tabIdWindowIdMap })
}
