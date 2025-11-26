<template>
  <div>
    <!-- System Message -->
    <div v-if="message.isSystem" class="text-center q-py-sm">
      <span class="text-caption text-grey-7">
        {{ message.content }}
      </span>
    </div>

    <!-- Regular Message -->
    <q-chat-message
      v-else
      :sent="isOwn"
      :text="[processedContent]"
      text-html
      :text-color="isOwn ? 'white' : 'black'"
      :bg-color="messageBgColor"
      @mouseenter="onMouseEnter"
      @mouseleave="onMouseLeave"
    >
      <template v-slot:name>{{ message.author }}</template>
      <template v-slot:avatar>
        <q-avatar size="40px" :color="authorAvatar ? undefined : 'accent'" text-color="white">
          <img
            v-if="authorAvatar"
            :src="authorAvatar"
            :alt="message.author"
          />
          <template v-else>
            {{ authorInitial }}
          </template>
          <q-badge
            v-if="authorStatus === 'online'"
            color="positive"
            floating
            rounded
          />
          <q-badge
            v-else-if="authorStatus === 'dnd'"
            color="red"
            floating
            rounded
            class="status-badge"
          >
            <q-icon
              name="remove"
              size="8px"
              color="white"
            />
          </q-badge>
        </q-avatar>
      </template>

      <template v-slot:stamp>
        <div class="row items-center no-wrap">
          <span class="text-caption">{{ formatTime(message.timestamp) }}</span>
          <span v-if="message.editedAt" class="text-caption text-grey-6 q-ml-xs">
            (upravené)
          </span>

          <!-- Message Actions -->
          <q-slide-transition>
            <div v-show="showActions" class="q-ml-sm">
              <q-btn
                flat dense round size="xs"
                icon="reply"
                color="grey-7"
                @click.stop="$emit('reply', message)"
              >
                <q-tooltip>Odpovedať</q-tooltip>
              </q-btn>

              <q-btn
                v-if="isOwn"
                flat dense round size="xs"
                icon="edit"
                color="grey-7"
                @click.stop="$emit('edit', message)"
              >
                <q-tooltip>Upraviť</q-tooltip>
              </q-btn>

              <q-btn
                flat dense round size="xs"
                icon="content_copy"
                color="grey-7"
                @click.stop="$emit('copy', message)"
              >
                <q-tooltip>Kopírovať</q-tooltip>
              </q-btn>

              <q-btn
                v-if="isOwn"
                flat dense round size="xs"
                icon="delete"
                color="negative"
                @click.stop="$emit('delete', message)"
              >
                <q-tooltip>Vymazať</q-tooltip>
              </q-btn>
            </div>
          </q-slide-transition>
        </div>
      </template>
    </q-chat-message>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue'
import type { ChatMessage, User } from '../types'

export default defineComponent({
  name: 'MessageItem',
  props: {
    message: {
      type: Object as PropType<ChatMessage>,
      required: true
    },
    isOwn: {
      type: Boolean,
      default: false
    },
    currentUserId: {
      type: Number,
      required: true
    },
    currentUserNick: {
      type: String,
      default: ''
    },
    users: {
      type: Array as PropType<User[]>,
      default: () => []
    }
  },
  emits: ['reply', 'edit', 'delete', 'copy'],
  data() {
    return {
      showActions: false,
      isHovered: false
    }
  },
  computed: {
    processedContent(): string {
      const content = this.message.content || ''
      const mentionClass = this.isOwn ? 'mention-own' : 'mention-other'

      // Replace @mentions with styled spans
      return content.replace(
        /@([A-Za-z0-9_]+)/g,
        `<span class="${mentionClass}">@$1</span>`
      )
    },
    authorAvatar(): string {
      const author = this.users.find(u => u.id === this.message.authorId)
      if (author?.avatarUrl) {
        return author.avatarUrl
      }
      return ''
    },
    authorInitial(): string {
      const author = this.users.find(u => u.id === this.message.authorId)
      if (author?.nickName) {
        return author.nickName.charAt(0).toUpperCase()
      }
      return this.message.author?.charAt(0)?.toUpperCase() || 'U'
    },
    authorStatus(): string | undefined {
      const author = this.users.find(u => u.id === this.message.authorId)
      return author?.status
    },
    messageBgColor(): string {
      const mentionsMe = this.message.mentionsMe
      const isOwn = this.isOwn
      if (mentionsMe && !isOwn) {
        return 'amber-1'
      }
      return isOwn ? 'primary' : 'grey-3'
    }
  },
  methods: {
    getStatusColor(status: string): string {
      switch (status) {
        case 'online':
          return 'positive'
        case 'dnd':
          return 'red'
        case 'offline':
          return 'grey'
        default:
          return 'grey'
      }
    },
    formatTime(timestamp: Date | string): string {
      const date = new Date(timestamp)
      return date.toLocaleTimeString('sk-SK', {
        hour: '2-digit',
        minute: '2-digit'
      })
    },
    onMouseEnter(): void {
      this.showActions = true
      this.isHovered = true
    },
    onMouseLeave(): void {
      this.showActions = false
      this.isHovered = false
    }
  }
})
</script>

<style scoped>
.status-badge {
  width: 14px !important;
  height: 14px !important;
  min-width: 14px !important;
  min-height: 14px !important;
  padding: 0 !important;
  display: flex !important;
  align-items: center;
  justify-content: center;
  z-index: 10 !important;
}

:deep(.q-avatar) {
  position: relative !important;
  z-index: 5 !important;
}

:deep(.mention-own) {
  color: #fef3c7 !important;
  font-weight: bold;
  text-decoration: underline;
}

:deep(.mention-other) {
  color: #1976d2 !important;
  font-weight: bold;
}
</style>
