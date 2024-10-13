import { mfetch } from './http'

export function useSearchUser(key?: Ref<string>) {
  let timer: any
  const userResults = ref<{ id: number, name: string, email: string }[]>([])
  function onSearch(k?: string) {
    clearTimeout(timer)
    timer = setTimeout(() => {
      const _k = k || key?.value
      if (!_k?.trim()) {
        userResults.value = []
        return
      }
      mfetch(`/user/search?keyword=${_k}`).then(r => r.json()).then((res) => {
        userResults.value = res.data || []
      }).catch(() => {})
    }, 400)
  }
  return { onSearch, userResults }
}
