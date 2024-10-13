<!-- eslint-disable no-console -->
<script setup lang='ts'>
import { bags, drawerCollapsed, getSearchResults, iconSize, isCurrentCollectionLoading, listType } from '../store'
import { specialTabs } from '../data'
import { useIconAction } from '../hooks/icon_action'

const router = useRouter()
const { onSelect, current } = useIconAction()

const max = ref(200)
const searchbar = ref<{ input: HTMLElement }>()

const { search, icons, category, collection, variant } = getSearchResults()
const loading = isCurrentCollectionLoading()

const maxMap = new Map<string, number>()
const id = computed(() => collection.value?.id)
const url = computed(() => collection.value?.url || collection.value?.author?.url)
const npm = computed(() => (id.value != null && !specialTabs.includes(id.value)) ? `https://www.npmjs.com/package/@iconify-json/${id.value}` : '')
const namespace = computed(() => (id.value != null && !specialTabs.includes(id.value)) ? `${id.value}:` : '')

function toggleCategory(cat: string) {
  if (category.value === cat)
    category.value = ''
  else
    category.value = cat
}

function toggleVariant(v: string) {
  if (variant.value === v)
    variant.value = ''
  else
    variant.value = v
}

function loadMore() {
  max.value += 100
  maxMap.set(namespace.value, max.value)
}

async function loadAll() {
  if (!namespace.value)
    return
  max.value = icons.value.length
  maxMap.set(namespace.value, max.value)
}

watch(
  () => namespace.value,
  () => max.value = maxMap.get(namespace.value) || 200,
)

function focusSearch() {
  searchbar.value?.input.focus()
}

onMounted(focusSearch)
watch(router.currentRoute, focusSearch, { immediate: true })

router.afterEach(() => {
  focusSearch()
})

onKeyStroke('/', (e) => {
  e.preventDefault()
  focusSearch()
})

onKeyStroke('Escape', () => {
  if (current.value !== '') {
    current.value = ''
    focusSearch()
  }
})

const categoriesContainer = ref<HTMLElement | null>(null)
const { x } = useScroll(categoriesContainer)
useEventListener(categoriesContainer, 'wheel', (e: WheelEvent) => {
  e.preventDefault()
  if (e.deltaX)
    x.value += e.deltaX
  else
    x.value += e.deltaY
}, {
  passive: false,
})
</script>

<template>
  <div class="flex flex-auto h-full overflow-hidden">
    <Drawer
      h-full overflow-y-overlay flex-none hidden md:block
      :w="drawerCollapsed ? '0px' : '250px'"
      transition-all duration-300
    />

    <button
      fixed top="50%" flex="~ items-end justify-center" w-5 h-8
      icon-button transition-all duration-300
      border="t r b base rounded-r-full" z-10 max-md:hidden
      title="Toggle Sidebar"
      :style="{ left: drawerCollapsed ? '0px' : '250px' }"
      @click="drawerCollapsed = !drawerCollapsed"
    >
      <iconify-icon
        icon="carbon-chevron-left"
        icon-button ml--1
        transition duration-300 ease-in-out
        :class="drawerCollapsed ? 'transform rotate-180' : ''"
      />
    </button>

    <!-- Loading -->
    <div
      v-if="collection && loading"
      class="h-full w-full flex-auto relative bg-base bg-opacity-75 content-center transition-opacity duration-100"
      :class="loading ? '' : 'opacity-0 pointer-events-none'"
    >
      <div class="absolute text-gray-800 dark:text-dark-500" style="top:50%;left:50%;transform:translate(-50%,-50%)">
        Loading...
      </div>
    </div>

    <div v-else-if="collection" h-full w-full relative max-h-full grid="~ rows-[max-content_1fr]" of-hidden>
      <div pt-5 flex="~ col gap-2">
        <div class="flex px-8">
          <!-- Left -->
          <div class="flex-auto px-2">
            <div class="text-gray-900 text-xl flex select-none dark:text-gray-200">
              <div class="whitespace-no-wrap overflow-hidden">
                {{ collection.name }}
              </div>
              <a
                v-if="url"
                class="ml-1 mt-1 text-base opacity-25 hover:opacity-100"
                :href="url"
                target="_blank"
              >
                <Icon icon="la:external-link-square-alt-solid" />
              </a>
              <a
                v-if="npm"
                class="ml-1 mt-1 text-base opacity-25 hover:opacity-100"
                :href="npm"
                target="_blank"
              >
                <Icon icon="la:npm" />
              </a>
              <div class="flex-auto" />
            </div>
            <div class="text-xs block opacity-50">
              {{ collection.author?.name }}
            </div>
            <div v-if="collection.license">
              <a
                class="text-xs opacity-50 hover:opacity-100"
                :href="collection.license.url"
                target="_blank"
              >{{ collection.license.title }}</a>
            </div>
          </div>

          <!-- Right -->
          <div class="flex flex-col">
            <ActionsMenu :collection="collection" />
            <div class="flex-auto" />
          </div>
        </div>

        <!-- Categories -->
        <div v-if="collection.categories" ref="categoriesContainer" class="mx-8 flex flex-wrap gap-2 select-none">
          <div
            v-for="c of Object.keys(collection.categories).sort()"
            :key="c"
            class="
                whitespace-nowrap text-sm inline-block px-2 border border-base rounded-full hover:bg-gray-50 cursor-pointer
                dark:border-dark-200 dark:hover:bg-dark-200
              "
            :class="c === category ? 'text-primary border-primary dark:border-primary' : 'opacity-75'"
            @click="toggleCategory(c)"
          >
            {{ c }}
          </div>
        </div>

        <!-- Searching -->
        <SearchBar
          ref="searchbar"
          v-model:search="search"
          class="mx-8 hidden md:flex"
        />

        <!-- Variants --->
        <div v-if="collection.variants" class="mx-8 mb-2 flex flex-wrap gap-2 select-none items-center">
          <div text-sm op50>
            Variants
          </div>
          <div
            v-for="c of Object.keys(collection.variants).sort()"
            :key="c"
            class="
                whitespace-nowrap text-sm inline-block px-2 border border-base rounded-full hover:bg-gray-50 cursor-pointer
                dark:border-dark-200 dark:hover:bg-dark-200
              "
            :class="c === variant ? 'text-primary border-primary dark:border-primary' : 'opacity-75'"
            @click="toggleVariant(c)"
          >
            {{ c }}
          </div>
        </div>
      </div>
      <div of-y-scroll of-x-hidden>
        <!-- Icons -->
        <div class="px-5 pt-2 pb-4 text-center">
          <Icons
            :icons="icons.slice(0, max)"
            :selected="bags"
            :class="iconSize"
            :display="listType"
            :search="search"
            :namespace="namespace"
            @select="onSelect"
          />
          <button v-if="icons.length > max" class="btn mx-1 my-3" @click="loadMore">
            Load More
          </button>
          <button v-if="icons.length > max && namespace" class="btn mx-1 my-3" @click="loadAll">
            Load All ({{ icons.length - max }})
          </button>
          <p class="color-fade text-sm pt-4">
            {{ icons.length }} icons
          </p>
        </div>

        <Footer />
      </div>
    </div>
  </div>
</template>
