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

                <!-- Empty state for no messages -->
                <div v-if="messages.length === 0" class="text-center q-pa-xl">
                  <q-icon name="forum" size="80px" color="grey-5" />
                  <div class="text-h6 text-grey-7 q-mt-md">Žiadne správy</div>
                  <div class="text-caption text-grey-6">Buď prvý, kto napíše správu!</div>
                </div>
              </div>
              <TypingIndicator :users="typingUsers" />
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
        :channel-id="channelId"
        :current-user-id="currentUser.id"
        :members="members"
        :channels="channels"
        @message-sent="(content: string) => handleMessageSent(content)"
        @command-executed="handleCommand"
      />
    </div>
  </q-page>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue'
import type { QScrollArea } from 'quasar'
import MessageInput from '../components/MessageInput.vue'
import type { User, ChatMessage, TypingUser, Channel } from '../types'
import MessageItem from '../components/MessageItem.vue'
import TypingIndicator from '../components/TypingIndicator.vue'
import { getMessages } from '../api'
import websocketService, { type TypingEvent, type StoppedTypingEvent } from '../services/websocket'

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
    },
    channels: {
      type: Array as PropType<Channel[]>,
      default: () => []
    }
  },
  emits: ['message-sent', 'toggle-members-drawer', 'channels-changed', 'member-kicked'],
  data() {
    return {
      messages: [] as ChatMessage[],
      scrollTarget: null as Element | null,
      loadingOlder: false,
      hasMore: true,
      oldestMessageId: null as number | null,
      pageSize: 30,
      initialLoad: true,
      unsubscribers: [] as Array<() => void>,
      typingUsers: [] as TypingUser[],
      typingTimeouts: new Map<number, NodeJS.Timeout>(),
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

    // Join the channel room
    websocketService.joinChannel(this.channelId)

    // Load initial messages
    void this.initializeMessages().then(() => {
      void this.$nextTick(() => {
        this.scrollToBottom(false)
      })
    })

    // Listen for incoming messages - use arrow function to capture current channelId
    const unsubscribe = websocketService.onMessage((message) => {
      console.log('ChatPage received message:', message, 'current channelId:', this.channelId)
      // Only add if it's for this channel and not already in the list
      if (message.channelId === this.channelId && !this.messages.find(m => m.id === message.id)) {
        console.log('Adding message to list')
        // Add mentionsMe flag
        const mentionedUserIds = message.mentionedUserIds || []
        const mentionsMe = mentionedUserIds.includes(this.currentUserId)
        const enrichedMessage = {
          ...message,
          mentionsMe
        }
        this.messages = [...this.messages, enrichedMessage]
        void this.$nextTick(() => {
          this.scrollToBottom()
        })
      } else {
        console.log('Message ignored - wrong channel or duplicate')
      }
    })
    this.unsubscribers.push(unsubscribe)

    // Listen for typing events
    const unsubTyping = websocketService.onTyping((event: TypingEvent) => {
      console.log('ChatPage: typing event received', event, 'currentChannelId:', this.channelId, 'currentUserId:', this.currentUserId)

      if (event.channelId !== this.channelId) {
        console.log('ChatPage: ignoring typing - different channel')
        return
      }
      if (event.userId === this.currentUserId) {
        console.log('ChatPage: ignoring own typing')
        return
      }

      // Find or add user
      const existingIndex = this.typingUsers.findIndex(u => u.userId === event.userId)

      // Make sure messagePreview is properly set
      const preview = event.messagePreview?.trim() || 'typing...'
      console.log('ChatPage: messagePreview from event:', event.messagePreview, 'using:', preview)

      const typingUser: TypingUser = {
        channelId: event.channelId,
        userId: event.userId,
        nickName: event.nickName,
        isTyping: true,
        messagePreview: preview,
      }

      if (existingIndex >= 0) {
        console.log('ChatPage: updating existing typing user')
        // Use splice for reactive update
        this.typingUsers.splice(existingIndex, 1, typingUser)
      } else {
        console.log('ChatPage: adding new typing user')
        this.typingUsers.push(typingUser)
      }
      console.log('ChatPage: typingUsers now:', this.typingUsers)

      // Auto-remove after 7 seconds as fallback
      const existing = this.typingTimeouts.get(event.userId)
      if (existing) clearTimeout(existing)

      const timeout = setTimeout(() => {
        this.removeTypingUser(event.userId)
      }, 7000)
      this.typingTimeouts.set(event.userId, timeout)
    })
    this.unsubscribers.push(unsubTyping)

    // Listen for stopped typing events
    const unsubStoppedTyping = websocketService.onStoppedTyping((event: StoppedTypingEvent) => {
      console.log('ChatPage: stopped typing event', event)
      if (event.channelId !== this.channelId) return
      this.removeTypingUser(event.userId)
    })
    this.unsubscribers.push(unsubStoppedTyping)
  },
  beforeUnmount() {
    // Cleanup message listeners
    this.unsubscribers.forEach(unsub => unsub())

    // Clear all typing timeouts
    this.typingTimeouts.forEach(timeout => clearTimeout(timeout))
    this.typingTimeouts.clear()

    // Leave the channel room when component unmounts
    websocketService.leaveChannel(this.channelId)
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
    channelId(newId, oldId) {
      if (oldId !== undefined && newId !== oldId) {
        console.log('ChatPage: channelId changed from', oldId, 'to', newId)
        console.log('ChatPage: Clearing messages, current count:', this.messages.length)
        this.messages = []
        this.hasMore = true
        this.oldestMessageId = null
        this.initialLoad = true

        // Clear typing users
        this.typingUsers = []
        this.typingTimeouts.forEach(timeout => clearTimeout(timeout))
        this.typingTimeouts.clear()

        console.log('ChatPage: Messages cleared, new count:', this.messages.length)
      }
    }
  },
  methods: {
    async initializeMessages(): Promise<void> {
      this.messages = []
      this.hasMore = true
      this.oldestMessageId = null
      this.initialLoad = true

      try {
        const token = localStorage.getItem('auth_token') ?? undefined
        const result = await getMessages(this.channelId, token, undefined, this.pageSize)
        // Enrich messages with mentionsMe flag
        this.messages = result.messages.map(msg => ({
          ...msg,
          mentionsMe: (msg.mentionedUserIds || []).includes(this.currentUserId)
        }))
        this.hasMore = result.hasMore
        this.oldestMessageId = result.oldestMessageId
        this.initialLoad = false
      } catch (error) {
        console.error('Failed to load messages:', error)
        this.$q.notify({
          type: 'negative',
          message: 'Nepodarilo sa načítať správy',
          position: 'top'
        })
        this.initialLoad = false
      }
    },
    async onLoad(_index: number, done: (stop?: boolean) => void): Promise<void> {
      if (this.loadingOlder || !this.hasMore) {
        done(true)
        return
      }

      const scrollArea = this.$refs.scrollArea as QScrollArea | undefined
      const target = scrollArea?.getScrollTarget()
      const previousHeight = target?.scrollHeight ?? 0

      this.loadingOlder = true

      try {
        const token = localStorage.getItem('auth_token') ?? undefined
        const result = await getMessages(
          this.channelId,
          token,
          this.oldestMessageId ?? undefined,
          this.pageSize
        )

        if (result.messages.length > 0) {
          // Enrich messages with mentionsMe flag
          const enrichedMessages = result.messages.map(msg => ({
            ...msg,
            mentionsMe: (msg.mentionedUserIds || []).includes(this.currentUserId)
          }))
          this.messages = [...enrichedMessages, ...this.messages]
          this.hasMore = result.hasMore
          this.oldestMessageId = result.oldestMessageId

          void this.$nextTick(() => {
            if (scrollArea && target) {
              const newHeight = target.scrollHeight
              const diff = newHeight - previousHeight
              const currentPosition = target.scrollTop
              scrollArea.setScrollPosition('vertical', currentPosition + diff, 0)
            }
            this.loadingOlder = false
            done(!this.hasMore)
          })
        } else {
          this.loadingOlder = false
          done(true)
        }
      } catch (error) {
        console.error('Failed to load older messages:', error)
        this.$q.notify({
          type: 'negative',
          message: 'Nepodarilo sa načítať staršie správy',
          position: 'top'
        })
        this.loadingOlder = false
        done(true)
      }
    },
    handleMessageSent(content: string): void {
      // Extract mentioned user IDs from @nickName patterns
      const mentionedUserIds = this.extractMentions(content)

      // Send message via WebSocket
      websocketService.sendMessage(this.channelId, content, mentionedUserIds)
      // Message will be received back via the onMessage listener after server processes it
    },
    extractMentions(content: string): number[] {
      const mentionRegex = /@([a-zA-Z0-9_]+)/g
      const matches = content.matchAll(mentionRegex)
      const userIds: number[] = []

      for (const match of matches) {
        const nickName = match[1]
        if (!nickName) continue

        const user = this.members.find((m) => m.nickName.toLowerCase() === nickName.toLowerCase())
        if (user) {
          userIds.push(user.id)
        }
      }

      return [...new Set(userIds)] // Remove duplicates
    },
    handleCommand(payload: { command: string; [key: string]: unknown }): void {
      if (payload.command === 'list') {
        this.$emit('toggle-members-drawer')
      }
      // Ak bol príkaz cancel/quit/join, notifikuj parent o zmene kanálov
      if (['cancel', 'quit', 'join'].includes(payload.command)) {
        this.$emit('channels-changed')
      }
      // Ak bol user odstránený (revoke alebo kick), odstráň ho zo zoznamu členov
      if (payload.command === 'revoke' && payload.userId) {
        this.$emit('member-kicked', payload.userId as number)
      }
      if (payload.command === 'kick' && payload.banned && payload.userId) {
        this.$emit('member-kicked', payload.userId as number)
      }
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
    },
    removeTypingUser(userId: number): void {
      const index = this.typingUsers.findIndex(u => u.userId === userId)
      if (index >= 0) {
        this.typingUsers.splice(index, 1)
      }

      // Clear timeout
      const timeout = this.typingTimeouts.get(userId)
      if (timeout) {
        clearTimeout(timeout)
        this.typingTimeouts.delete(userId)
      }
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
