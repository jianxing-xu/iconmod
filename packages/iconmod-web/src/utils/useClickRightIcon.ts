import { createVNode, render } from 'vue'
import { showGlobalTip, toggleBag } from '../store'
import { projects } from '../store/project'

const Menu = defineComponent({
  props: { icon: { type: String }, x: { type: Number }, y: { type: Number }, opts: { type: Object } },
  setup(props, { emit }) {
    const project = computed(() => projects.value.find(it => it.id === props.opts?.id))

    function close() {
      emit('close')
    }
    onMounted(() => {
      document.removeEventListener('click', close)
      document.addEventListener('click', close)
    })
    onUnmounted(() => {
      document.removeEventListener('click', close)
    })
    return {
      project,
      onAddToBag() {
        toggleBag(props.icon as string)
        emit('close')
      },
      onCopy() {
        navigator.clipboard.writeText(props.icon as string)
        showGlobalTip('Copied')
      },
    }
  },
  render() {
    return h('div', {
      style: { top: `${this.$props.y}px`, left: `${this.$props.x}px` },
      class: 'fixed overflow-hidden rd-1 border dark:border dark:border-dark-300 bg-white dark:bg-dark-100',
    }, [
      h('div', {
        class: 'px2 py1 border-b border-base text-3 icon-button cursor-pointer',
        onClick: this.onAddToBag,
      }, 'Toggle to Bag'),
      h('div', {
        class: 'px2 py1 border-b border-base text-3 icon-button cursor-pointer',
        onClick: this.onCopy,
      }, 'Copy icon name'),
    ])
  },
})

interface MenuOpts { bag: boolean, projectId?: number }
function showMenu(icon: string, x: number, y: number, onClose?: () => void, opts?: MenuOpts) {
  const box = document.createElement('div')
  const vnode = createVNode(Menu, { icon, x, y, onClose, opts })
  render(vnode, box)
  document.body.appendChild(box)
  return () => {
    vnode.appContext?.app?.unmount?.()
    box.remove()
  }
}

export function useRightClickIcon(opts?: MenuOpts) {
  let close: any
  function onContextMenu(iconName: string, e: MouseEvent) {
    close?.()
    opts = Object.assign({ bag: true }, opts || {})
    e.preventDefault()
    close = showMenu(iconName, e.x, e.y, () => {
      close()
    }, opts)
  }
  return { onContextMenu }
}
