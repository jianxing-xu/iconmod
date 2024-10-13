<script setup lang='ts'>
import type { PropType } from 'vue'
import { activeMode, iconSize, inProgress, isFavoritedCollection, listType, progressMessage, toggleFavoriteCollection } from '../store'
import type { CollectionMeta } from '../data'
import { PackIconFont, PackJsonZip, PackSvgZip, RemotePackSVGSprite } from '../utils/pack'

const props = defineProps({
  collection: {
    type: Object as PropType<CollectionMeta>,
    required: true,
  },
})

const menu = ref(
  listType.value === 'list'
    ? 'list'
    : iconSize.value === 'text-4xl'
      ? 'large'
      : 'small',
)

async function packIconFont() {
  if (!props.collection)
    return

  progressMessage.value = 'Downloading...'
  inProgress.value = true
  await nextTick()
  progressMessage.value = 'Packing up...'
  await nextTick()
  await PackIconFont(
    props.collection.icons.map(i => `${props.collection!.prefix}:${i}`),
    { fontName: props.collection.name, fileName: props.collection.prefix },
  )
  inProgress.value = false
}

async function packSvgs() {
  if (!props.collection)
    return

  progressMessage.value = 'Downloading...'
  inProgress.value = true
  await nextTick()
  progressMessage.value = 'Packing up...'
  await nextTick()
  await PackSvgZip(
    props.collection.icons.map(i => `${props.collection!.prefix}:${i}`),
    props.collection.prefix as string,
  )
  inProgress.value = false
}

async function packJson() {
  if (!props.collection)
    return

  progressMessage.value = 'Downloading...'
  inProgress.value = true
  await nextTick()
  progressMessage.value = 'Packing up...'
  await nextTick()
  await PackJsonZip(
    props.collection.icons.map(i => `${props.collection!.prefix}:${i}`),
    props.collection.prefix as string,
  )
  inProgress.value = false
}

async function packSymbolds() {
  if (!props.collection)
    return
  await RemotePackSVGSprite(Number.parseInt(props.collection.id))
}

watch(
  menu,
  async (current, prev) => {
    switch (current) {
      case 'small':
        iconSize.value = 'text-2xl'
        listType.value = 'grid'
        return
      case 'large':
        iconSize.value = 'text-4xl'
        listType.value = 'grid'
        return
      case 'list':
        iconSize.value = 'text-3xl'
        listType.value = 'list'
        return
      case 'select':
        activeMode.value = 'select'
        break
      case 'copy':
        activeMode.value = 'copy'
        break
      case 'download_iconfont':
        packIconFont()
        break
      case 'download_svgs':
        packSvgs()
        break
      case 'download_json':
        packJson()
        break
      case 'download_symbols':
        packSymbolds()
        break
    }

    await nextTick()
    menu.value = prev
  },
  { flush: 'pre' },
)

const favorited = computed(() => isFavoritedCollection(props.collection.prefix as string))
</script>

<template>
  <div flex="~ gap3" text-xl items-center>
    <DarkSwitcher />

    <RouterLink
      icon-button
      i-carbon-settings
      title="Settings"
      to="/settings"
    />

    <iconify-icon
      v-if="collection.prefix !== 'all'"
      icon-button
      :icon="favorited ? 'carbon:star-filled' : 'carbon:star'"
      title="Toggle Favorite"
      @click="toggleFavoriteCollection(collection.prefix as string)"
    />
    <!-- Menu -->
    <div icon-button cursor-pointer relative title="Menu">
      <iconify-icon icon="carbon:menu" />
      <select
        v-model="menu"
        absolute w-full dark:bg-dark-100 text-base top-0 right-0 opacity-0 z-10
      >
        <optgroup label="Size">
          <option value="small">
            Small
          </option>
          <option value="large">
            Large
          </option>
          <option value="list">
            List
          </option>
        </optgroup>
        <optgroup label="Modes">
          <option value="select">
            Multiple select
          </option>
          <option value="copy">
            Name copying mode
          </option>
        </optgroup>

        <!--
            TODO: due to this function requires to download and pack
                  the full set, we should make some UI to aware users
                  in browser version.
          -->
        <optgroup v-if="collection.prefix !== 'all'" label="Downloads">
          <option value="download_iconfont" :disabled="inProgress">
            Iconfont
          </option>
          <option value="download_svgs" :disabled="inProgress">
            SVGs Zip
          </option>
          <option value="download_json" :disabled="inProgress">
            JSON
          </option>
          <option value="download_symbols" :disabled="inProgress">
            Svg Symbols
          </option>
        </optgroup>
      </select>
    </div>
    <slot />
    <!-- TODO: improve design of custom select -->
    <!-- <CustomSelect v-model="menu" :options="options">
      <div icon-button cursor-pointer relative i-carbon-menu title="Menu" />
    </CustomSelect> -->
  </div>
</template>
