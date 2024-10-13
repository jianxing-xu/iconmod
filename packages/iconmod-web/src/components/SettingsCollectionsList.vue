<script setup lang="ts">
import type { CollectionMeta } from '../data'
import { isInstalled } from '../data'
import { isExcludedCategory, isExcludedCollection, isFavoritedCollection, toggleExcludedCollection, toggleFavoriteCollection } from '../store'

defineProps<{
  collections: CollectionMeta[]
}>()
</script>

<template>
  <div>
    <div
      v-for="c, idx of collections" :key="c.id" flex="~ gap-2" py1 px2 items-center
      border="~ base" mt--1px break-inside-avoid
      :class="idx === 0 ? 'border-t' : ''"
    >
      <RouterLink
        :to="`/collection/${c.id}`"
        flex-auto
        :class="isExcludedCollection(c) ? 'op25 line-through' : ''"
      >
        {{ c.name }}
      </RouterLink>
      <div />
      <div
        v-if="isInstalled(c.id)"
        icon-button class="!op50"
        title="Cached in browser"
      >
        <iconify-icon icon="carbon-cloud-auditing" />
      </div>
      <button
        v-if="!isExcludedCollection(c)"
        icon-button text-yellow
        title="Toggle Favorite"
        @click="toggleFavoriteCollection(c.id)"
      >
        <iconify-icon :icon="isFavoritedCollection(c.id) ? 'carbon:star-filled' : 'carbon:star'" />
      </button>
      <button
        v-if="!isExcludedCategory(c.category)"
        icon-button text-rose
        title="Toggle Visible"
        @click="toggleExcludedCollection(c.id)"
      >
        <iconify-icon :icon="isExcludedCollection(c) ? 'carbon:view-off' : 'carbon:view'" />
      </button>
    </div>
  </div>
</template>
