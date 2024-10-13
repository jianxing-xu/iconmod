export function useDragTarget(elRef: Ref<HTMLElement>, cb: (e: DragEvent) => void) {
  watch(elRef, () => {
    if (!elRef.value)
      return
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach((eventName) => {
      elRef.value.addEventListener(eventName, (e) => {
        e.preventDefault()
        if (eventName === 'drop') {
          e.preventDefault()
          cb(e as DragEvent)
        }
      }, false)
    })
  })
}
