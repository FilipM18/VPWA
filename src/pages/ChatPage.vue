<template>
  <q-page class="chat-page-container">

    <!-- Messages Area with Scroll -->
    <div class="messages-wrapper">
      <q-scroll-area
        ref="scrollArea"
        class="messages-scroll-area"
      >
        <q-infinite-scroll
          :offset="250"
          @load="onLoad"
          :scroll-target="scrollTarget || undefined"
          reverse
        >
          <div class="">
            <div
              class="col-xs-12 col-sm-12 col-md-10 col-lg-8 col-xl-7 q-pa-md"
              :class="$q.screen.lt.md ? 'q-pa-sm' : 'q-pa-md'"
            >
              <!-- Messages or Empty State -->
              <div v-if="messages.length > 0">
                <!-- Date Separators and Messages -->
                <template v-for="(item, index) in messagesWithDates" :key="`item-${index}`">
                  <!-- Date Separator -->
                  <div
                    v-if="item.type === 'date'"
                    class="date-separator q-my-md"
                  >
                    <q-chip
                      color="grey-4"
                      text-color="grey-8"
                      icon="event"
                      square
                    >
                      {{ item.label }}
                    </q-chip>
                  </div>

                  <!-- Message Item -->
                  <message-item
                    v-else-if="item.type === 'message'"
                    :message="item.data"
                    :is-own="item.data.authorId === currentUserId"
                    :current-user-id="currentUserId"
                    :users="members"
                  />
                </template>

                <!-- Typing Indicator as a message -->
                <div v-if="typingUsers.length > 0" class="q-mb-md">
                  <TypingIndicator :users="typingUsers" />
                </div>
              </div>

              <!-- Empty State -->
              <div v-else class="text-center q-pa-xl">
                <q-icon name="forum" size="80px" color="grey-5" />
                <div class="text-h6 text-grey-7 q-mt-md">Žiadne správy</div>
                <div class="text-caption text-grey-6">Buď prvý, kto napíše správu!</div>
              </div>
            </div>
          </div>

          <template v-slot:loading>
            <div class="row justify-center q-my-md">
              <q-spinner-dots color="primary" size="40px" />
            </div>
          </template>
        </q-infinite-scroll>
      </q-scroll-area>
    </div>

    <!-- Message Input at Bottom (Fixed) -->
    <div class="bottom-section">
      <q-separator />
      <message-input
        :current-user="currentUser"
        :channel-id="channelId"
        :members="members"
        @message-sent="handleMessageSent"
      />
    </div>
  </q-page>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue'
import type { QScrollArea } from 'quasar'
import MessageInput from '../components/MessageInput.vue'
import type { User, ChatMessage } from '../types'
import MessageItem from '../components/MessageItem.vue'
import { mockMessages } from '../utils/mockMessages'
import TypingIndicator from '../components/TypingIndicator.vue'

type MessageWithDate = { type: 'date'; label: string }
type MessageEntry = { type: 'message'; data: ChatMessage }
type MessageListItem = MessageWithDate | MessageEntry

export default defineComponent({
  name: 'ChatPage',
  components: {
    MessageInput,
    MessageItem,
    TypingIndicator
  },
  props: {
    channelId: {
      type: Number,
      required: true
    },
    currentUser: {
      type: Object as PropType<User>,
      required: true
    },
    members: {
      type: Array as PropType<User[]>,
      default: () => []
    }
  },
  emits: ['message-sent'],
  data() {
    return {
      messages: [] as ChatMessage[],
      allMessages: [] as ChatMessage[],
      scrollTarget: null as Element | null,
      pageSize: 10,
      nextIndex: 0,
      loadingOlder: false,
      typingUsers: [
        { channelId: 1, userId: 5, nickName: 'Eva', isTyping: true, messagePreview: 'Ahoj, poďme...', avatarUrl: 'https://cdn.quasar.dev/img/avatar5.jpg' },
        { channelId: 1, userId: 1, nickName: 'Ján', isTyping: true, messagePreview: 'Čo robíš dnes?', avatarUrl: 'https://cdn.quasar.dev/img/avatar1.jpg' },
        { channelId: 1, userId: 3, nickName: 'Peter', isTyping: true, messagePreview: 'Pridám sa k vám...', avatarUrl: 'https://cdn.quasar.dev/img/avatar3.jpg' }
      ]
    }
  },
  mounted() {
    void this.$nextTick(() => {
      const scrollArea = this.$refs.scrollArea as QScrollArea | undefined
      if (scrollArea) {
        const target = scrollArea.getScrollTarget()
        this.scrollTarget = target
        scrollArea.setScrollPosition('vertical', target.scrollHeight, 0)
      }
    })
  },
  computed: {
    currentUserId(): number {
      return this.currentUser.id
    },
    messagesWithDates(): MessageListItem[] {
      const items: MessageListItem[] = []
      let lastDate: string | null = null

      this.messages.forEach((message) => {
        const messageDate = new Date(message.timestamp)
        const dateLabel = this.formatDate(messageDate)

        if (lastDate !== dateLabel) {
          items.push({ type: 'date', label: dateLabel })
          lastDate = dateLabel
        }

        items.push({ type: 'message', data: message })
      })

      return items
    }
  },
  watch: {
    channelId: {
      immediate: true,
      handler() {
        this.initializeMessages()
        void this.$nextTick(() => {
          this.scrollToBottom(false)
        })
      }
    }
  },
  methods: {
    initializeMessages(): void {
      const filtered = mockMessages.filter(message => message.channelId === this.channelId)
      const sorted = [...filtered].sort((a, b) => {
        const timeA = new Date(a.timestamp).getTime()
        const timeB = new Date(b.timestamp).getTime()
        return timeA - timeB
      })
      this.allMessages = sorted
      const total = sorted.length
      const startIndex = Math.max(0, total - this.pageSize)
      this.nextIndex = startIndex
      this.messages = sorted.slice(startIndex)
    },
    onLoad(_index: number, done: (stop?: boolean) => void): void {
      if (this.loadingOlder) {
        done()
        return
      }
      if (this.nextIndex <= 0) {
        done(true)
        return
      }

      const scrollArea = this.$refs.scrollArea as QScrollArea | undefined
      const target = scrollArea?.getScrollTarget()
      const previousHeight = target?.scrollHeight ?? 0

      this.loadingOlder = true
      const nextStart = Math.max(0, this.nextIndex - this.pageSize)
      const older = this.allMessages.slice(nextStart, this.nextIndex)
      this.messages = [...older, ...this.messages]
      this.nextIndex = nextStart

      void this.$nextTick(() => {
        if (scrollArea && target) {
          const newHeight = target.scrollHeight
          const diff = newHeight - previousHeight
          const currentPosition = target.scrollTop
          scrollArea.setScrollPosition('vertical', currentPosition + diff, 0)
        }
        this.loadingOlder = false
        done(this.nextIndex === 0)
      })
    },
    handleMessageSent(message: ChatMessage): void {
      const newMessage: ChatMessage = {
        ...message,
        id: this.messages.length + 1,
        channelId: this.channelId,
        authorId: this.currentUserId,
        author: this.currentUser.nickName,
        timestamp: new Date()
      }
      this.allMessages = [...this.allMessages, newMessage]
      this.messages = [...this.messages, newMessage]
      this.$emit('message-sent', newMessage)
      void this.$nextTick(() => {
        this.scrollToBottom()
      })
    },
    formatDate(date: Date): string {
      const today = new Date()
      const messageDate = new Date(date)
      const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      const messageDateOnly = new Date(
        messageDate.getFullYear(),
        messageDate.getMonth(),
        messageDate.getDate()
      )
      const diffTime = todayDate.getTime() - messageDateOnly.getTime()
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
      if (diffDays === 0) {
        return 'Dnes'
      }
      if (diffDays === 1) {
        return 'Včera'
      }
      if (diffDays < 7) {
        return messageDate.toLocaleDateString('sk-SK', { weekday: 'long' })
      }
      return messageDate.toLocaleDateString('sk-SK', {
        day: 'numeric',
        month: 'long',
        year: messageDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      })
    },
    scrollToBottom(animated = true): void {
      const scrollArea = this.$refs.scrollArea as QScrollArea | undefined
      if (!scrollArea) {
        return
      }
      const target = scrollArea.getScrollTarget()
      scrollArea.setScrollPosition('vertical', target.scrollHeight, animated ? 300 : 0)
    }
  }
})
</script>

<style scoped>
/* Main container - uses flexbox to position messages area and input */
.chat-page-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background: #f5f5f5;
}

/* Messages scroll area - takes all available space */
.messages-wrapper {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
}

.messages-scroll-area {
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
}

/* Date separator styling */
.date-separator {
  display: flex;
  justify-content: center;
  align-items: center;
}

/* Fixed bottom section for typing indicator and input */
.bottom-section {
  flex: 0 0 auto;
  background: white;
  border-top: 1px solid #e0e0e0;
}
</style>
