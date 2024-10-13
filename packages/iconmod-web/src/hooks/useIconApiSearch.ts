import { mfetch } from '../utils/http'

export const SEARCH_LIMIT = 200

let abortC = new AbortController()

export function useIconApiSearch(keyword: Ref<string>) {
  const page = ref(1)
  const pageSize = ref(SEARCH_LIMIT)
  const icons = ref<string[]>([])
  const isDone = ref(false)
  const err = ref()
  const loading = ref(false)

  async function getIcons() {
    abortC.abort()
    if (!keyword.value.trim()) {
      icons.value = []
      page.value = 1
      return
    }
    loading.value = true
    try {
      abortC = new AbortController()
      const result = await mfetch(`/search?query=${keyword.value}&limit=${pageSize.value}&start=0`, { signal: abortC.signal }).then(r => r.json()).catch(() => {})
      icons.value = result.icons
      isDone.value = result.total < SEARCH_LIMIT
    }
    catch (e) {
      err.value = e
    }
    finally {
      loading.value = false
    }
  }
  function refresh() {
    getIcons()
  }

  debouncedWatch(keyword, async () => {
    icons.value = []
    getIcons()
  }, { debounce: 500 })
  watch([page, pageSize], () => {
    getIcons()
  })

  async function loadMore() {
    page.value += 1
  }

  return { page, pageSize, icons, loadMore, loading, err, isDone, refresh }
}
