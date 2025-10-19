<template>
  <div class="message-input-wrapper">
    <!-- Input Container with max-width for centering -->
    <div class="message-input-container">
      <!-- Input Field -->
      <div class="q-pa-md bg-white">
        <q-input
          ref="messageInput"
          v-model="message"
          filled
          dense
          placeholder="Napíš správu alebo príkaz (/ pre nápovedu)"
          :maxlength="2000"
        >
        <template v-slot:prepend>
          <q-btn 
            flat 
            dense 
            round 
            icon="attachment" 
            size="sm"
          >
            <q-tooltip>Priložiť súbor</q-tooltip>
          </q-btn>
        </template>

        <template v-slot:append>
          <!-- Emoji Picker -->
          <q-btn flat dense round icon="mood" size="sm">
            <q-popup-proxy>
              <div class="q-pa-md" style="width: 320px">
                <div class="text-subtitle2 q-mb-sm">Emoji</div>
                <div class="row q-gutter-xs">
                  <q-btn
                    v-for="emoji in quickEmojis"
                    :key="emoji"
                    flat
                    dense
                    :label="emoji"
                    @click="insertEmoji(emoji)"
                    size="md"
                  />
                </div>
              </div>
            </q-popup-proxy>
          </q-btn>

          <!-- Send Button -->
          <q-btn
            flat
            dense
            round
            icon="send"
            color="primary"
            size="sm"
            :disable="!canSend"
          >
            <q-tooltip>Odoslať (Enter)</q-tooltip>
          </q-btn>
        </template>
      </q-input>

      <!-- Character Counter -->
      <div class="text-right text-caption text-grey-6 q-mt-xs">
        <span :class="{ 'text-warning': message.length > 1800 }">
          {{ message.length }} / 2000
        </span>
      </div>
    </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue'
import type { User } from '../types'

export default defineComponent({
  name: 'MessageInput',
  props: {
    channelId: {
      type: Number,
      required: true
    },
    members: {
      type: Array as PropType<User[]>,
      default: () => []
    }
  },
  emits: ['message-sent', 'command-executed', 'typing'],
  data() {
    return {
      message: '',
      quickEmojis: ['👍', '❤️', '😂', '😎', '🤔', '👏', '🔥', '🎉', '💯', '✅', '🚀', '💪'] as string[]
    }
  },
  computed: {
    canSend(): boolean {
      return this.message.trim().length > 0
    },
  },
  methods: {
    insertEmoji(emoji: string): void {
      this.message += emoji
      const input = this.$refs.messageInput as { focus: () => void } | undefined
      input?.focus()
    },
  },
})
</script>

<style scoped>
.message-input-wrapper {
  background: white;
  width: 100%;
  display: flex;
  justify-content: center;
}


.message-input-container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  box-sizing: border-box;
}

@media (max-width: 1600px) {
  .message-input-container {
    max-width: 1000px;
  }
}

@media (max-width: 1200px) {
  .message-input-container {
    max-width: 900px;
  }
}

@media (max-width: 1023px) {
  .message-input-container {
    max-width: 100%;
  }
}

@media (max-width: 767px) {
  .message-input-wrapper :deep(.q-pa-md) {
    padding: 12px;
  }
  
  .message-input-wrapper :deep(.q-input) {
    font-size: 14px;
  }
  
  .message-input-wrapper :deep(.q-btn) {
    min-width: 32px;
    min-height: 32px;
  }
}

@media (max-width: 599px) {
  .message-input-wrapper :deep(.q-pa-md) {
    padding: 8px;
  }
  
  .message-input-wrapper :deep(.q-input) {
    font-size: 13px;
  }
  
  .message-input-wrapper :deep(.q-btn) {
    min-width: 28px;
    min-height: 28px;
  }
  
  .message-input-wrapper :deep(.q-btn .q-icon) {
    font-size: 18px;
  }
}
</style>