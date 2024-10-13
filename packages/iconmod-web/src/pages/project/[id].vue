<script setup lang='ts'>
import ActionsMenu from '../../components/ActionsMenu.vue'
import { useIconAction } from '../../hooks'
import { bags, iconSize, listType, showGlobalTip } from '../../store'
import { KEYS } from '../../utils/bus'
import { mfetch } from '../../utils/http'

const props = defineProps<{
  id: string
}>()

const max = 100
const { onSelect } = useIconAction()
const { on, off } = useEventBus(KEYS.REFRESH_PROJECT_ICONS)

const project = ref<{ name: string, id: string, icons: string[], prefix: string }>()
const search = ref('')
const showMemberManage = ref(false)

const isMultiple = ref(false)
const multipleSelected = ref(new Set<string>())
const removing = ref(false)

const icons = computed(() => project?.value?.icons || [])
const filterIcons = computed(() => icons.value.filter(it => it.includes(search.value)))

function loadMore() {}
function loadAll() {}
function onSelectIcon(icon: string) {
  if (isMultiple.value) {
    if (multipleSelected.value.has(icon)) {
      multipleSelected.value.delete(icon)
    }
    else {
      multipleSelected.value.add(icon)
    }
  }
  else {
    onSelect(icon)
  }
}

function removeIcons() {
  if (removing.value)
    return
  removing.value = true
  mfetch('/project/removeicons', {
    method: 'POST',
    body: JSON.stringify({
      projectId: project?.value?.id,
      icons: [...multipleSelected.value.values()].map(it => it.split(':')[1]),
    }),
  }).then(() => {
    showGlobalTip('Remove successful!')
    multipleSelected.value.clear()
    isMultiple.value = false
    initData()
  }).catch(() => {}).finally(() => removing.value = false)
}

function initData() {
  mfetch(`/project/info?prefix=${props.id}`).then(r => r.json()).then((res) => {
    if (res.data) {
      res.data.icons = res.data.uncategorized
      delete res.data.uncategorized
      project.value = res.data
    }
  }).catch(() => {})
}
initData()

onMounted(() => {
  off(initData)
  on(initData)
})
</script>

<template>
  <WithNavbar>
    <div v-if="!project" class="py-8 px-4 text-gray-700 text-center dark:text-dark-700">
      Loading...
    </div>
    <div v-else class="flex flex-auto h-full overflow-hidden">
      <div
        h-full overflow-y-overlay flex-none hidden md:block
        w="250px"
        transition-all duration-300
        border-r border-base
      />

      <div h-full w-full relative max-h-full grid="~ rows-[max-content_1fr]" of-hidden>
        <div pt-5 flex="~ col gap-2">
          <div class="flex px-8">
            <!-- Left -->
            <div class="flex-auto px-2">
              <div class="text-gray-900 text-xl flex select-none dark:text-gray-200">
                <div class="whitespace-no-wrap overflow-hidden">
                  {{ project?.name }}
                </div>
                <div v-if="multipleSelected.size && isMultiple" class="flex items-center ml3 icon-button text-3 cursor-pointer outline rd-1 px1" @click="removeIcons">
                  Remove selected
                  <iconify-icon v-show="removing" icon="svg-spinners:270-ring-with-bg" class="ml-1" />
                </div>
              </div>
            </div>

            <!-- Right -->
            <div v-if="project" class="flex flex-col">
              <ActionsMenu :collection="{ ...project }">
                <div title="Project member manage">
                  <iconify-icon icon="tdesign:member" class="icon-button" @click="showMemberManage = true" />
                </div>
                <div title="Multiple select mode">
                  <iconify-icon
                    icon="ci:select-multiple" class="icon-button"
                    :class="{ 'text-primary': isMultiple }"
                    @click="isMultiple = !isMultiple, !isMultiple && multipleSelected.clear(), isMultiple && showGlobalTip('Multiple select actioin mode')"
                  />
                </div>
              </ActionsMenu>
              <div class="flex-auto" />
            </div>
          </div>

          <!-- Searching -->
          <SearchBar v-model:search="search" class="mx-8 hidden md:flex" />
        </div>
        <div of-y-scroll of-x-hidden>
          <!-- Icons -->
          <div class="px-5 pt-2 pb-4 text-center">
            <Icons
              :icons="filterIcons.slice(0, max)"
              :selected="bags"
              :checked="multipleSelected"
              :namespace="`${id}:`"
              :class="iconSize"
              :display="listType"
              :search="search"
              @select="onSelectIcon"
            />
            <button v-if="icons.length > max" class="btn mx-1 my-3" @click="loadMore">
              Load More
            </button>
            <button v-if="icons.length > max" class="btn mx-1 my-3" @click="loadAll">
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
    <ModalDialog :value="showMemberManage">
      <MemberManagerDialog v-if="project?.id" :project-id="project?.id" @close="showMemberManage = false" />
    </ModalDialog>
  </WithNavbar>
</template>
