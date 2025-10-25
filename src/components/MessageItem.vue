<template>
  <div>
    <!-- System Message -->
    <div
      v-if="message.isSystem"
      class="text-center q-py-sm"
    >
      <span class="text-caption text-grey-7">
        {{ message.content }}
      </span>
    </div>

    <!-- Regular Message -->
    <div
      v-else
      :class="[
        'q-mb-md',
        'rounded-borders',
        'q-pa-sm',
        'transition',
        'relative-position',
        { 'own': isOwn, 'someone': !isOwn, 'mentioned': isMentioned }
      ]"
      :style="[hoverStyle, bubbleStyle]"
      @mouseenter="onMouseEnter"
      @mouseleave="onMouseLeave"
    >
    <!-- Message Header -->
    <div class="row items-center no-wrap q-mb-xs">
      <q-avatar
        :color="avatarColor"
        text-color="white"
        :size="$q.screen.lt.sm ? '32px' : '36px'"
      >
        {{ message.author.charAt(0).toUpperCase() }}
      </q-avatar>

      <div class="q-ml-sm">
        <span :class="['text-weight-bold', $q.screen.lt.sm ? 'text-body2' : 'text-body1']">
          {{ message.author }}
        </span>
        <q-badge
          v-if="isOwn"
          color="blue-grey-5"
          label="ty"
          class="q-ml-xs"
        />
        <span :class="['text-caption text-grey-7', $q.screen.lt.sm ? 'q-ml-xs' : 'q-ml-sm']">
          {{ formatTime(message.timestamp) }}
        </span>
        <span
          v-if="message.editedAt"
          class="text-caption text-grey-6 q-ml-xs"
        >
          (upravené)
        </span>
      </div>

      <q-space />

      <!-- Message Actions -->
      <q-slide-transition>
        <div
          v-show="showActions"
          class="row no-wrap items-center"
          :class="$q.screen.lt.sm ? 'q-gutter-x-xs' : 'q-gutter-x-sm'"
        >
          <q-btn
            flat
            dense
            round
            :size="$q.screen.lt.sm ? 'xs' : 'sm'"
            icon="reply"
            color="grey-7"
            @click="$emit('reply', message)"
          >
            <q-tooltip>Odpovedať</q-tooltip>
          </q-btn>

          <q-btn
            v-if="isOwn"
            flat
            dense
            round
            :size="$q.screen.lt.sm ? 'xs' : 'sm'"
            icon="edit"
            color="grey-7"
            @click="$emit('edit', message)"
          >
            <q-tooltip>Upraviť</q-tooltip>
          </q-btn>

          <q-btn
            v-if="isOwn"
            flat
            dense
            round
            :size="$q.screen.lt.sm ? 'xs' : 'sm'"
            icon="delete"
            color="negative"
            @click="$emit('delete', message)"
          >
            <q-tooltip>Zmazať</q-tooltip>
          </q-btn>
        </div>
      </q-slide-transition>
    </div>

    <!-- Message Content -->
    <div
      :class="[
        'q-ml-lg q-pl-md',
        $q.screen.lt.sm ? 'text-body2' : 'text-body1'
      ]"
      style="word-wrap: break-word; overflow-wrap: break-word; line-height: 1.6;"
    >
      <div v-html="formattedContent"></div>

    </div>

    <q-badge
      v-if="message.mentionsMe"
      color="amber"
      text-color="amber-10"
      label="Bol si spomenutý"
      class="q-ml-lg q-mt-xs"
    />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue'
import type { ChatMessage } from '../types'

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
    isMentioned(): boolean {
      const byFlag = !!this.message.mentionsMe
      const ids = (this.message as ChatMessage & { mentionedUserIds?: number[] }).mentionedUserIds
      const byIds = Array.isArray(ids) && ids.includes(this.currentUserId)
      const nick = this.currentUserNick?.trim()
      const byText = !!(nick && new RegExp(`@${nick}\\b`, 'i').test(this.message.content))
      return byFlag || byIds || byText
    },
    bubbleStyle(): Record<string,string> {
      return {
        maxWidth: 'min(92%, 720px)',
        marginLeft: this.isOwn ? 'auto' : '0',
        marginRight: this.isOwn ? '0' : 'auto'
      }
    },
    hoverStyle(): Record<string, string> {
      return {
        transform: this.isHovered ? 'translateX(2px)' : 'translateX(0)',
        transition: 'all 0.2s ease',
        border: '1px solid rgba(15, 23, 42, 0.1)',
        background: this.isHovered && !this.message.mentionsMe && !this.isOwn ? 'rgba(0, 0, 0, 0.02)' : ''
      }
    },
    avatarColor(): string {
      const colors = ['purple', 'blue', 'green', 'orange', 'red', 'teal', 'pink', 'indigo']
      const hash = this.message.author.split('').reduce((accumulator, character) => accumulator + character.charCodeAt(0), 0)
      return colors[hash % colors.length] || 'primary'
    },
    mentionedUsers(): string[] {
      const m = this.message.content.match(/@([A-Za-z0-9_]+)/g) || []
      return [...new Set(m.map(s=>s.slice(1)))]
    },
    formattedContent(): string {
      let content = this.escapeHtml(this.message.content)
      content = content.replace(/@(\w+)/g, '<span class="text-primary text-weight-bold">@$1</span>')
      content = content.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" class="text-primary">$1</a>')
      content = content.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      content = content.replace(/\*([^*]+?)\*/g, '<em>$1</em>')
      content = content.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
      content = content.replace(/\n/g, '<br>')
      return content
    },
  },
  methods: {
    formatTime(timestamp: Date | string): string {
      const date = new Date(timestamp)
      return date.toLocaleTimeString('sk-SK', {
        hour: '2-digit',
        minute: '2-digit'
      })
    },
    escapeHtml(text: string): string {
      const map: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
      }
      return text.replace(/[&<>"']/g, match => map[match] ?? match)
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
/* moje vs ostatné */
.own { background: var(--q-secondary); color: var(--q-dark); }
.someone { background: #fff; color: var(--q-dark); }

/* keď niekto mentione mňa alebo mňa */
.mentioned:not(.own) {
  background: rgba(193,154,107,0.20);
  border-left: 3px solid #c19a6b;
}
</style>
