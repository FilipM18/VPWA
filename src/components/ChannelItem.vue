<template>
  <q-item
    clickable
    v-ripple
    :active="isActive"
    active-class="bg-primary text-white"
    @click="$emit('select', channel)"
    class="rounded-borders q-mb-xs"
    :class="[{ 'invited': invited }]"
  >
    <q-item-section avatar>
      <q-avatar size="32px" :color="channel.isPrivate ? 'orange' : 'primary'" text-color="white">
        <q-icon :name="channel.isPrivate ? 'lock' : 'tag'" size="16px" />
      </q-avatar>
    </q-item-section>

    <q-item-section>
      <q-item-label lines="1">
        {{ channel.name }}
      </q-item-label>
      <q-item-label v-if="channel.lastMessage" caption lines="1">
        {{ channel.lastMessage }}
      </q-item-label>
    </q-item-section>

    <q-item-section side>
      <q-badge
        v-if="channel.unreadCount && channel.unreadCount > 0"
        color="red"
        :label="channel.unreadCount"
        class="q-mb-xs"
      />

      <q-icon v-if="invited" name="fiber_new" color="warning" size="sm" />

      <q-btn v-if="isActive" flat dense round icon="more_vert" size="sm" @click.stop>
        <q-menu auto-close>
          <q-list dense>
            <q-item clickable @click="$emit('leave', channel)">
              <q-item-section avatar>
                <q-icon name="exit_to_app" />
              </q-item-section>
              <q-item-section>Opustiť</q-item-section>
            </q-item>

            <template v-if="isAdmin">
              <q-separator />
              <q-item clickable class="text-negative" @click="$emit('delete', channel)">
                <q-item-section avatar>
                  <q-icon name="delete" />
                </q-item-section>
                <q-item-section>Zmazať</q-item-section>
              </q-item>
            </template>
          </q-list>
        </q-menu>
      </q-btn>
    </q-item-section>
  </q-item>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import type { Channel } from '../types';

export default defineComponent({
  name: 'ChannelItem',
  props: {
    channel: {
      type: Object as PropType<Channel & { lastMessage?: string }>,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    invited: {
      type: Boolean,
      default: false
    }
  },
  emits: ['select', 'leave', 'delete'],
});
</script>
<style scoped>
.invited { 
  background: rgba(193,154,107,.20); 
  border-left: 3px solid #c19a6b; 
}

.q-item--active.invited { 
  background: var(--q-primary); 
  color:#fff; 
  border-left-color: transparent; 
}
</style>
