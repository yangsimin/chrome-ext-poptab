(() => {
  const btnId = 'ext-back-btn'
  const styleId = 'ext-style'

  if (!document.getElementById(btnId)) {
    const back = createButton(btnId)
    document.body.prepend(back)
  }

  if (!document.getElementById(styleId)) {
    const style = createStyle(styleId)
    document.head.appendChild(style)
  }

  window.addEventListener('beforeunload', () => {
    document.getElementById(btnId)?.remove()
    document.getElementById(styleId)?.remove()
  })

  function createButton(id: string) {
    const container = document.createElement('div');
    const placeholder = document.createElement('div')
    const button = document.createElement('div')

    container.appendChild(placeholder)
    container.appendChild(button)

    container.id = id

    Object.assign(placeholder.style, {
      height: '30px',
    })

    Object.assign(
      button.style,
      {
        position: 'fixed',
        width: '100vw',
        lineHeight: '30px',
        top: '0',
        backgroundColor: '#0006',
        zIndex: '9999999999999999',
        color: '#ddd',
        textAlign: 'center',
        fontWeight: 'bold',
        borderTopLeftRadius: '4px',
        borderBottomLeftRadius: '4px',
        cursor: 'pointer',
      } satisfies Partial<CSSStyleDeclaration>
    )
    button.innerText = 'Back'
    button.addEventListener('click', (event) => {
      event.stopPropagation()
      chrome.runtime.sendMessage('reset')
      document.getElementById(btnId)?.remove()
      document.getElementById(styleId)?.remove()
    })

    return container
  }

  function createStyle(id: string) {
    const style = document.createElement('style')
    style.innerText = '::-webkit-scrollbar {display: none;}'
    style.id = id
    return style
  }
})()