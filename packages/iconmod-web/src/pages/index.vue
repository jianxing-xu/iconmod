<script setup lang='ts'>
import type { PresentType } from '../data'
import { categories, categorySearch, favoritedCollections, filteredCollections, recentCollections } from '../data'
import { useIconAction } from '../hooks'
import { useIconApiSearch } from '../hooks/useIconApiSearch'
import { bags, iconSize, listType } from '../store'
import { getOwnProejcts, projects, showCreateProject } from '../store/project'

const searchbar = ref<{ input: HTMLElement }>()

const { onSelect } = useIconAction()
const { icons, loading, refresh } = useIconApiSearch(categorySearch)

const categorized = ref(getCollections(categorySearch.value))
let categorizeDebounceTimer: NodeJS.Timeout | null = null

watch([categorySearch, favoritedCollections, recentCollections, projects], ([newVal]) => {
  if (categorizeDebounceTimer)
    clearTimeout(categorizeDebounceTimer)
  categorizeDebounceTimer = setTimeout(() => {
    categorizeDebounceTimer = null
    categorized.value = getCollections(newVal)
  }, 500)
})
function getCollections(searchString: string) {
  if (searchString) {
    return [
      {
        name: 'Result',
        type: 'result' as PresentType,
        collections: filteredCollections.value,
      },
    ]
  }
  else {
    return [
      {
        name: 'Projects',
        collections: projects.value?.map(it => ({ ...it, id: it.prefix })),
        type: 'project',
      },
      {
        name: 'Favorites',
        type: 'favorite' as PresentType,
        collections: favoritedCollections.value,
      },
      {
        name: 'Recent',
        type: 'recent' as PresentType,
        collections: recentCollections.value,
      },
      ...categories.value.map(category => ({
        name: category,
        type: 'normal' as PresentType,
        collections: filteredCollections.value.filter(collection => collection.category === category),
      })),
    ]
  }
}

const router = useRouter()
onKeyStroke('/', (e) => {
  e.preventDefault()
  router.replace('/collection/all')
})
onMounted(() => {
  searchbar.value?.input.focus()
  getOwnProejcts()
})
</script>

<template>
  <WithNavbar>
    <div of-hidden grid="~ rows-[max-content_1fr]">
      <!-- Searching -->
      <div md:mx-6 md:mt-6>
        <SearchBar
          ref="searchbar"
          v-model:search="categorySearch"
          placeholder="Search category..."
          flex
          @on-enter="refresh"
        />
      </div>

      <div of-y-auto>
        <!-- Icon listing -->
        <div v-if="icons.length" px4>
          <div px-2 op50 mt6 text-lg>
            Icons
          </div>
          <Icons
            :icons="icons"
            :selected="bags"
            :class="iconSize"
            :display="listType"
            @select="onSelect"
          />
          <p class="color-fade text-sm pt-4">
            {{ icons.length }} icons
          </p>
        </div>
        <!-- Category listing -->
        <template v-for="c of categorized" :key="c.name">
          <div v-if="(c.collections).length" px4>
            <div px-2 op50 mt6 text-lg>
              {{ c.name }}
            </div>
            <CollectionEntries
              of-hidden
              :collections="c.collections"
              :type="c.type"
              @create="showCreateProject = true"
            />
          </div>
        </template>

        <div
          v-if="categorized.every(c => !c.collections.length) && !icons.length && !loading"
          class="flex flex-col flex-grow w-full py-6 justify-center items-center"
        >
          <Icon icon="ph:x-circle-bold" class="text-4xl mb-2 opacity-20" />
          <span class="text-lg opacity-60">There is no result corresponding to your search query.</span>
        </div>
        <div v-if="loading" class="flex flex-col flex-grow w-full py-6 justify-center items-center">
          <Icon icon="svg-spinners:180-ring-with-bg" class="text-4xl mb-2 opacity-20" />
          <span class="text-lg opacity-60">Loading...</span>
        </div>
        <Footer />
      </div>
    </div>
  </WithNavbar>
</template>
