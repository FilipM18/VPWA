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

    <!-- Regular Message using q-chat-message -->
    <q-chat-message
      v-else
      :sent="isOwn"
      :text-color="isOwn ? 'white' : 'black'"
      :bg-color="messageBgColor"
      @mouseenter="onMouseEnter"
      @mouseleave="onMouseLeave"
    >
      <template v-slot:name>{{ message.author }}</template>
      <template v-slot:avatar>
        <img
          :class="isOwn ? 'q-message-avatar q-message-avatar--sent' : 'q-message-avatar q-message-avatar--received'"
          :src="authorAvatar"
          :alt="message.author"
        >
      </template>

      <!-- Message Content -->
      <div v-html="formattedContent"></div>

      <!-- Mention badge -->
      <div v-if="message.mentionsMe" class="q-mt-xs">
        <q-badge color="amber" text-color="amber-10" label="Bol si spomenutý" />
      </div>

      <template v-slot:stamp>
        <div class="row items-center no-wrap">
          <span class="text-caption">{{ formatTime(message.timestamp) }}</span>
          <span v-if="message.editedAt" class="text-caption text-grey-6 q-ml-xs">
            (upravené)
          </span>
          
          <!-- Message Actions on hover -->
          <q-slide-transition>
            <div
              v-show="showActions"
              class="message-actions absolute-top-right q-mt-xs q-mr-xs"
            >
              <q-btn
                flat
                dense
                round
                size="xs"
                icon="reply"
                color="grey-7"
                @click.stop="$emit('reply', message)"
              >
                <q-tooltip>Odpovedať</q-tooltip>
              </q-btn>

              <q-btn
                v-if="isOwn"
                flat
                dense
                round
                size="xs"
                icon="edit"
                color="grey-7"
                @click.stop="$emit('edit', message)"
              >
                <q-tooltip>Upraviť</q-tooltip>
              </q-btn>

              <q-btn
                flat
                dense
                round
                size="xs"
                icon="content_copy"
                color="grey-7"
                @click.stop="$emit('copy', message)"
              >
                <q-tooltip>Kopírovať</q-tooltip>
              </q-btn>

              <q-btn
                v-if="isOwn"
                flat
                dense
                round
                size="xs"
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
    authorAvatar(): string {
      // Ak máme users, nájdeme avatara podľa authorId
      const author = this.users.find(u => u.id === this.message.authorId)
      if (author?.avatarUrl) {
        return author.avatarUrl
      }
      // Fallback - vygenerujeme avatar URL podľa avatarColor sem treba doplniť 
      return '' 
    },
    formattedStamp(): string {
      return this.formatTime(this.message.timestamp)
    },
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
    messageBgColor(): string {
      if (this.message.mentionsMe && !this.isOwn) {
        return 'amber-1'
      }
      return this.isOwn ? 'primary' : 'grey-3'
    },
    mentionedUsers(): string[] {
      const m = this.message.content.match(/@([A-Za-z0-9_]+)/g) || []
      return [...new Set(m.map(s=>s.slice(1)))]
    },
    formattedContent(): string {
      let content = this.escapeHtml(this.message.content)
      // Pre vlastné správy použijeme svetlejšiu farbu pre mentions (text-amber-1), inak primary
      const mentionClass = this.isOwn ? 'mention-own' : 'mention-other'
      content = content.replace(/@(\w+)/g, `<span class="text-weight-bold ${mentionClass}">@$1</span>`)
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
/* Mention styling */
.mention-own {
  color: #fef3c7 !important; 
  text-decoration: underline;
}
.mention-other {
  color: #1976d2 !important; 
}
.message-actions {
  opacity: 0;
  transition: opacity 0.2s;
}
.q-chat-message:hover .message-actions {
  opacity: 1;
}
</style>
