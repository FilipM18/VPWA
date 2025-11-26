<template>
  <div class="font-medium bg-white w-full flex justify-center" style="padding: 3px;">
    <div class="full-width q-my-none q-mx-auto">

      <q-slide-transition>
        <div v-if="showCommandHints" class="q-pa-sm bg-grey-2">
          <div class="text-caption text-grey-7 q-mb-xs">Dostupné príkazy:</div>
          <div class="row q-gutter-xs">
            <q-chip
              v-for="hint in filteredCommands"
              :key="hint.command"
              clickable
              @click="selectCommand(hint)"
              color="primary"
              text-color="white"
              size="sm"
              dense
            >
              <q-icon name="terminal" size="xs" class="q-mr-xs" />
              <strong>{{ hint.command }}</strong>
              <q-tooltip>{{ hint.description }}</q-tooltip>
            </q-chip>
          </div>
        </div>
      </q-slide-transition>

      <div class="bg-white q-pa-xs-xs q-pa-md-md q-pa-sm-sm">
        <q-input
          ref="messageInput"
          v-model="message"
          filled
          dense
          :input-class="inputTextClass"
          placeholder="Napíš správu alebo príkaz (/ pre nápovedu)"
          :maxlength="2000"
          @keydown.enter.exact.prevent="sendMessage"
          @keydown.tab.prevent="handleTabComplete"
          @update:model-value="handleInput"
        >
          <template #prepend>
            <q-btn flat dense round icon="attachment" :size="uiSize" :icon-size="iconPx">
              <q-tooltip>Priložiť súbor</q-tooltip>
            </q-btn>
          </template>

          <template #append>
            <q-btn flat dense round icon="mood" :size="uiSize" :icon-size="iconPx">
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
                      :size="uiSize"
                      @click="insertEmoji(emoji)"
                    />
                  </div>
                </div>
              </q-popup-proxy>
            </q-btn>

            <q-btn
              flat
              dense
              round
              icon="send"
              color="primary"
              :size="uiSize"
              :icon-size="iconPx"
              :disable="!canSend"
              @click="sendMessage"
            >
              <q-tooltip>Odoslať (Enter)</q-tooltip>
            </q-btn>
          </template>
        </q-input>

      </div>

    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue'
import type { User, Channel } from '../types'
import websocketService from '../services/websocket'
import { joinChannel, inviteToChannel, leaveChannel, kickMember } from '../api'

interface CommandHint { command: string; usage: string; description: string }

export default defineComponent({
  name: 'MessageInput',
  props: {
    channelId: { type: Number, required: true },
    members: { type: Array as PropType<User[]>, default: () => [] },
    currentUserId: { type: Number, required: true },
    channels: { type: Array as PropType<Channel[]>, default: () => [] }
  },
  emits: ['message-sent', 'command-executed'],
  data() {
    return {
      message: '',
      typingTimer: null as NodeJS.Timeout | null,
      isTyping: false,
      commands: [
        { command: '/join', usage: 'channelName [private]', description: 'Vytvor alebo sa pripoj do kanála' },
        { command: '/invite', usage: '@nickName', description: 'Pozvi používateľa (admin: unban)' },
        { command: '/kick', usage: '@nickName', description: 'Hlasuj o vyhodení (admin: insta ban)' },
        { command: '/revoke', usage: '@nickName', description: 'Odoberte prístup (iba admin)' },
        { command: '/cancel', usage: '[channelName]', description: 'Opusť kanál' },
        { command: '/quit', usage: '[channelName]', description: 'Zruš kanál (iba admin)' },
        { command: '/list', usage: '', description: 'Zobraz členov kanála' }
      ] as CommandHint[],
      quickEmojis: ['👍','❤️','😂','😎','🤔','👏','🔥','🎉','💯','✅','🚀','💪'] as string[]
    }
  },
  computed: {
    canSend(): boolean { return this.message.trim().length > 0 },
    showCommandHints(): boolean { return this.message.startsWith('/') && this.message.length >= 1 },
    filteredCommands(): CommandHint[] {
      if (!this.showCommandHints) return []
      const search = this.message.toLowerCase()
      return this.commands.filter(c => c.command.toLowerCase().startsWith(search)).slice(0, 5)
    },

    inputTextClass(): string {
      const s = this.$q.screen
      if (s.lt.sm) return 'text-caption'
      if (s.lt.md) return 'text-body2'
      return 'text-body1'
    },
    uiSize(): 'xs'|'sm'|'md' {
      const s = this.$q.screen
      if (s.lt.sm) return 'xs'
      if (s.lt.md) return 'sm'
      return 'md'
    },
    iconPx(): string | undefined {
      return this.$q.screen.lt.sm ? '18px' : undefined
    }
  },
  methods: {
    sendMessage(): void {
      const trimmed = this.message.trim()
      if (!trimmed) return

      // Handle commands
      if (trimmed.startsWith('/')) {
        this.handleCommand(trimmed)
        this.message = ''
        return
      }

      // Regular message
      this.$emit('message-sent', trimmed)
      this.message = ''

      // Stop typing indicator
      this.stopTypingIndicator()
    },
    handleInput(): void {
      console.log('handleInput called, message:', this.message)

      // Don't send typing for commands
      if (this.message.startsWith('/')) {
        this.stopTypingIndicator()
        return
      }

      // Stop typing if message is empty
      if (!this.message.trim()) {
        this.stopTypingIndicator()
        return
      }

      // Send typing indicator
      if (!this.isTyping) {
        this.isTyping = true
        console.log('Starting typing indicator')
        websocketService.sendTyping(this.channelId, this.message.substring(0, 50))
      } else {
        // Update preview
        console.log('Updating typing preview')
        websocketService.sendTyping(this.channelId, this.message.substring(0, 50))
      }

      // Reset timer - stop typing after 3s of inactivity
      if (this.typingTimer) {
        clearTimeout(this.typingTimer)
      }

      this.typingTimer = setTimeout(() => {
        console.log('Typing timer expired, stopping')
        this.stopTypingIndicator()
      }, 6000)
    },
    stopTypingIndicator(): void {
      if (this.isTyping) {
        this.isTyping = false
        websocketService.stopTyping(this.channelId)
      }
      if (this.typingTimer) {
        clearTimeout(this.typingTimer)
        this.typingTimer = null
      }
    },
    handleCommand(cmd: string): void {
      const parts = cmd.split(/\s+/)
      const command = parts[0]?.toLowerCase()

      if (command === '/list') {
        this.$emit('command-executed', { command: 'list' })
        return
      }

      if (command === '/join') {
        const channelName = parts[1]
        const isPrivate = parts[2]?.toLowerCase() === '[private]'

        if (!channelName) {
          this.$q.notify({ type: 'warning', message: 'Použitie: /join channelName [private]' })
          return
        }

        const token = localStorage.getItem('auth_token') || undefined
        joinChannel(channelName, isPrivate, token)
          .then(() => {
            this.$q.notify({ type: 'positive', message: `Úspęšne si sa pridal do #${channelName}` })
            this.$emit('command-executed', { command: 'join', channelName, isPrivate })
          })
          .catch((err: Error) => {
            this.$q.notify({ type: 'negative', message: err.message })
          })
        return
      }

      if (command === '/invite') {
        const nickName = parts[1]?.replace('@', '')

        if (!nickName) {
          this.$q.notify({ type: 'warning', message: 'Použitie: /invite @nickName' })
          return
        }

        const token = localStorage.getItem('auth_token') || undefined
        inviteToChannel(this.channelId, nickName, token)
          .then(() => {
            this.$q.notify({ type: 'positive', message: `Pozvánka odoslaná pre @${nickName}` })
          })
          .catch((err: Error) => {
            this.$q.notify({ type: 'negative', message: err.message })
          })
        return
      }

      if (command === '/kick') {
        const nickName = parts[1]?.replace('@', '')

        if (!nickName) {
          this.$q.notify({ type: 'warning', message: 'Použitie: /kick @nickName' })
          return
        }

        const token = localStorage.getItem('auth_token') || undefined
        this.kickMember(nickName, token)
        return
      }

      if (command === '/revoke') {
        const nickName = parts[1]?.replace('@', '')

        if (!nickName) {
          this.$q.notify({ type: 'warning', message: 'Použitie: /revoke @nickName' })
          return
        }

        const user = this.members.find(m => m.nickName === nickName)
        if (!user) {
          this.$q.notify({ type: 'warning', message: `Používateľ @${nickName} neexistuje` })
          return
        }

        const token = localStorage.getItem('auth_token') || undefined
        leaveChannel(this.channelId, user.id, undefined, token)
          .then(() => {
            this.$q.notify({ type: 'positive', message: `@${nickName} bol odstránený z kanála` })
            this.$emit('command-executed', { command: 'revoke', userId: user.id })
          })
          .catch((err: Error) => {
            this.$q.notify({ type: 'negative', message: err.message })
          })
        return
      }

      if (command === '/cancel') {
        const channelName = parts[1]
        let targetChannelId = this.channelId
        let targetChannel: Channel | undefined

        if (channelName) {
          targetChannel = this.channels.find(c => c.name === channelName)
          if (!targetChannel) {
            this.$q.notify({ type: 'warning', message: `Kanál #${channelName} nebol nájdený` })
            return
          }
          targetChannelId = targetChannel.id
        } else {
          targetChannel = this.channels.find(c => c.id === this.channelId)
        }

        // Ak je admin, zobraz dialóg s výberom
        const isAdmin = targetChannel && targetChannel.adminId === this.currentUserId

        if (isAdmin) {
          this.$q.dialog({
            title: 'Opusť kanál',
            message: `Si správca kanála #${targetChannel!.name}. Chceš kanál zmazať alebo ho len opusť?`,
            cancel: {
              label: 'Zrušiť',
              flat: true,
            },
            options: {
              type: 'radio',
              model: 'leave',
              items: [
                { label: 'Len opusť (kanál ostane bez správcu)', value: 'leave' },
                { label: 'Zmazať kanál natrvalo', value: 'delete' },
              ],
            },
            persistent: false,
          }).onOk((choice: string) => {
            const token = localStorage.getItem('auth_token') || undefined
            const deleteChannel = choice === 'delete'
            leaveChannel(targetChannelId, undefined, deleteChannel, token)
              .then(() => {
                const msg = deleteChannel
                  ? (channelName ? `Kanál #${channelName} bol zmazaný` : 'Kanál bol zmazaný')
                  : (channelName ? `Opustil si kanál #${channelName}` : 'Opustil si kanál')
                this.$q.notify({ type: 'positive', message: msg })
                this.$emit('command-executed', { command: 'cancel' })
              })
              .catch((err: Error) => {
                this.$q.notify({ type: 'negative', message: err.message })
              })
          })
        } else {
          // Nie je admin, len opusť
          const token = localStorage.getItem('auth_token') || undefined
          leaveChannel(targetChannelId, undefined, false, token)
            .then(() => {
              this.$q.notify({ type: 'positive', message: channelName ? `Opustil si kanál #${channelName}` : 'Opustil si kanál' })
              this.$emit('command-executed', { command: 'cancel' })
            })
            .catch((err: Error) => {
              this.$q.notify({ type: 'negative', message: err.message })
            })
        }
        return
      }

      if (command === '/quit') {
        const channelName = parts[1]
        let targetChannelId = this.channelId
        let targetChannel: Channel | undefined

        if (channelName) {
          targetChannel = this.channels.find(c => c.name === channelName)
          if (!targetChannel) {
            this.$q.notify({ type: 'warning', message: `Kanál #${channelName} nebol nájdený` })
            return
          }
          targetChannelId = targetChannel.id
        } else {
          targetChannel = this.channels.find(c => c.id === this.channelId)
        }

        // Skontrolovať či je admin
        const isAdmin = targetChannel && targetChannel.adminId === this.currentUserId
        if (!isAdmin) {
          this.$q.notify({ type: 'warning', message: '/quit môže použiť iba správca kanála' })
          return
        }

        const token = localStorage.getItem('auth_token') || undefined
        leaveChannel(targetChannelId, undefined, true, token)
          .then(() => {
            this.$q.notify({ type: 'positive', message: channelName ? `Kanál #${channelName} bol zmazaný` : 'Kanál bol zmazaný' })
            this.$emit('command-executed', { command: 'quit' })
          })
          .catch((err: Error) => {
            this.$q.notify({ type: 'negative', message: err.message })
          })
        return
      }

      this.$q.notify({
        type: 'info',
        message: `Príkaz ${command} nie je rozpoznaný`,
      })
    },
    insertEmoji(emoji: string): void {
      this.message += emoji
      const input = this.$refs.messageInput as { focus: () => void } | undefined
      input?.focus()
    },
    selectCommand(command: CommandHint): void {
      this.message = command.command + (command.usage ? ` ${command.usage}` : '')
      const input = this.$refs.messageInput as { focus: () => void } | undefined
      input?.focus()
    },
    handleTabComplete(): void {
      if (this.showCommandHints && this.filteredCommands.length > 0) {
        const first = this.filteredCommands[0]
        if (first) this.selectCommand(first)
      }
    },
    kickMember(nickName: string, token?: string): void {
      kickMember(this.channelId, nickName, token)
        .then((result) => {
          if (result.banned) {
            this.$q.notify({
              type: 'positive',
              message: `@${nickName} bol vyhodený z kanála (${result.kickVotes} hlasov)`,
            })
            this.$emit('command-executed', { command: 'kick', nickName, banned: true, userId: result.userId })
          } else {
            this.$q.notify({
              type: 'info',
              message: `Hlas pre vyhodenie @${nickName} zaznamenaný (${result.kickVotes}/3)`,
            })
          }
        })
        .catch((err: Error) => {
          this.$q.notify({ type: 'negative', message: err.message })
        })
    }
  },
  watch: {
    channelId(newChannelId, oldChannelId) {
      if (newChannelId !== oldChannelId) {
        console.log('Channel changed, clearing message')
        this.message = ''
        this.stopTypingIndicator()
      }
    }
  },
  beforeUnmount() {
    // Cleanup timer
    this.stopTypingIndicator()
  }
})
</script>
