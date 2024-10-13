export const globaTip = ref('')

export function showGlobalTip(msg: string, timeout: number = 2000) {
  globaTip.value = msg
  setTimeout(() => globaTip.value = '', timeout)
}
