(() => {
  const styleId = 'ext-style'

  if (!document.getElementById(styleId)) {
    const style = createStyle(styleId)
    document.head.appendChild(style)
  }

  window.addEventListener('beforeunload', () => {
    document.getElementById(styleId)?.remove()
  })

  window.removeEventListener('keydown', onKeydown)
  window.addEventListener('keydown', onKeydown)

  function onKeydown(event) {
    if (event.key === 'Escape') {
      console.log('keydown esc')
      chrome.runtime.sendMessage('reset')
      teardown()
    }
  }

  function createStyle(id: string) {
    const style = document.createElement('style')
    style.innerText = '::-webkit-scrollbar {display: none;}'
    style.id = id
    return style
  }

  function teardown() {
    window.removeEventListener('keydown', onKeydown)
    document.getElementById(styleId)?.remove()
  }
})()