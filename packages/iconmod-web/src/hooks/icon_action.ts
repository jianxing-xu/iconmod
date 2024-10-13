import { activeMode, showGlobalTip, toggleBag } from '../store'
import { getIconSnippet } from '../utils/icons'
import { cleanupQuery } from '../utils/query'

export const useIconAction = (function () {
  return function () {
    const router = useRouter()
    const route = useRoute()

    const current = computed({
      get() {
        return (route.query.icon as string) || ''
      },
      set(value) {
        router.replace({ query: cleanupQuery({ ...route.query, icon: value }) })
      },
    })
    async function copyText(text?: string) {
      if (text) {
        try {
          await navigator.clipboard.writeText(text)
          return true
        }
        catch {
        }
      }
      return false
    }

    function onCopy(status: boolean) {
      if (status) {
        showGlobalTip('Copied!')
      }
    }

    async function onSelect(icon: string) {
      switch (activeMode.value) {
        case 'select':
          toggleBag(icon)
          break
        case 'copy':
          onCopy(await copyText(await getIconSnippet(icon, 'id', true) || icon))
          break
        default:
          current.value = icon
          break
      }
    }
    return { onSelect, current, onCopy }
  }
})()
