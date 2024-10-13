import type { CollectionMeta } from '../data'
import {
  collectionList,
  getCollectionMeta,
  isInstalled,
} from '../data'
import { useSearch } from '../hooks'
import { recentIconIds } from './localstorage'

const currentCollectionId = ref('')
const loaded = ref(false)
const installed = ref(false)
const collection = shallowRef<CollectionMeta | null>(null)

export const getSearchResults = createSharedComposable(() => {
  return useSearch(collection)
})

export function useCurrentCollection() {
  return collection
}

export function isCurrentCollectionLoading() {
  return computed(() => !loaded.value)
}

const recentIconsCollection = computed((): CollectionMeta => ({
  id: 'recent',
  name: 'Recent',
  icons: recentIconIds.value,
  categories: Object.fromEntries(
    Array.from(new Set(
      recentIconIds.value.map(i => i.split(':')[0]),
    ))
      .map(id => [collectionList.value.find(i => i.id === id)?.name || id, recentIconIds.value.filter(i => i.startsWith(`${id}:`))]),
  ),
}))

export async function setCurrentCollection(id: string) {
  currentCollectionId.value = id

  if (!id) {
    loaded.value = false
    installed.value = false
    collection.value = null
    return collection.value
  }

  installed.value = isInstalled(id)

  if (id === 'recent') {
    collection.value = recentIconsCollection.value
    loaded.value = true
  }
  else {
    collection.value = await getCollectionMeta(id)
    loaded.value = true
  }
  return collection.value
}
