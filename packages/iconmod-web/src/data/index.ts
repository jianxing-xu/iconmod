import type { IconifyJSON } from 'iconify-icon'
import { addCollection } from 'iconify-icon'
import { AsyncFzf } from 'fzf'
import { favoritedCollectionIds, isFavoritedCollection, isRecentCollection, recentCollectionIds } from '../store'
import { loadCollection } from '../store/indexedDB'
import { mfetch } from '../utils/http'
import { variantCategories } from './variant-category'

export const specialTabs = ['all', 'recent']

export type PresentType = 'favorite' | 'recent' | 'normal' | 'project'

export interface CollectionInfo {
  id: string
  name: string
  author?: { name: string, url: string }
  license?: { title: string, url: string }
  url?: string
  samples?: string[]
  category?: string
  palette?: string
  total?: number
  prepacked?: IconifyJSON
  uncategorized?: string[]
}

export interface CollectionMeta extends CollectionInfo {
  prefix?: string
  icons: string[]
  categories?: Record<string, string[]>
  variants?: Record<string, string[]>
}

const installed = ref<string[]>([])

export const collectionList = ref<CollectionInfo[]>([])
export const categories = computed(() => [...new Set(Object.values(collectionList.value).map(it => it.category))])
export const filteredCollections = ref<CollectionInfo[]>([])

export const isSearchOpen = ref(false)
export const categorySearch = ref('')

let fzf: AsyncFzf<CollectionInfo[]> | null = null

watch([categorySearch, collectionList], ([q]) => {
  if (!q) {
    filteredCollections.value = collectionList.value
  }
  else {
    fzf?.find(q).then((result) => {
      filteredCollections.value = result.map(i => i.item)
    }).catch(() => {
      // The search is canceled
    })
  }
})

export const sortedCollectionsInfo = computed(() =>
  filteredCollections.value
    .sort((a, b) => {
      return favoritedCollectionIds.value.indexOf(b.id) - favoritedCollectionIds.value.indexOf(a.id)
    }),
)

export const favoritedCollections = computed(() =>
  filteredCollections.value.filter(i => isFavoritedCollection(i.id))
    .sort((a, b) => favoritedCollectionIds.value.indexOf(b.id) - favoritedCollectionIds.value.indexOf(a.id)),
)

export const recentCollections = computed(() =>
  filteredCollections.value.filter(i => isRecentCollection(i.id))
    .sort((a, b) => recentCollectionIds.value.indexOf(b.id) - recentCollectionIds.value.indexOf(a.id)),
)

export function isInstalled(id: string) {
  return installed.value.includes(id)
}
// install the preview icons on the homepage
export function preInstall() {
  mfetch('/collections').then(r => r.json()).then((res) => {
    collectionList.value = Object.keys(res).map(it => ({ ...res[it], id: it }))
    fzf = new AsyncFzf(Object.freeze(Object.values(collectionList.value)), {
      casing: 'case-insensitive',
      fuzzy: 'v1',
      selector: v => `${v.name} ${v.id} ${v.category} ${v.author}`,
    })
  }).catch(() => {})
}

export async function tryInstallFromLocal(id: string) {
  if (specialTabs.includes(id))
    return false

  if (installed.value.includes(id))
    return true

  const result = await loadCollection(id)
  if (!result || !result.data)
    return false

  const data = result.data
  addCollection(data)
  installed.value.push(id)

  return true
}

export async function getCollectionMeta(id: string): Promise<CollectionMeta | null> {
  let meta: CollectionMeta = await mfetch(`/collection?prefix=${id}`).then(r => r.json()).catch(() => {})
  if (meta) {
    meta.id = meta?.prefix as string
    const icons = Object.values(meta.categories || {}).reduce((pre, it) => pre.concat(it), [])
    icons.push(...(meta.uncategorized || []))
    meta.icons = icons
  }
  if (!meta)
    return null

  meta.variants ||= getVariantCategories(meta)

  meta = Object.freeze(meta)

  return meta
}

function getVariantCategories(collection: CollectionMeta) {
  const variantsRule = variantCategories[collection.id]
  if (!variantsRule)
    return

  const variants: Record<string, string[]> = {}

  for (const icon of collection.icons) {
    const name = variantsRule.find(i => typeof i[1] === 'string' ? icon.endsWith(i[1]) : i[1].test(icon))?.[0] || 'Regular'
    if (!variants[name])
      variants[name] = []
    variants[name].push(icon)
  }

  return variants
}

preInstall()
