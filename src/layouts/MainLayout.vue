<template>
  <q-layout view="hHh LpR fFf">
    <!-- Header -->
    <q-header elevated class="bg-primary text-white">
      <q-toolbar class="q-px-sm">
        <q-btn
          flat
          dense
          round
          icon="menu"
          @click="toggleLeftDrawer"
          :size="$q.screen.lt.sm ? 'sm' : 'md'"
        />

        <q-toolbar-title class="row items-center no-wrap">
          <q-icon
            name="tag"
            :size="$q.screen.lt.sm ? '20px' : '24px'"
            class="q-mr-sm"
          />
          <span class="ellipsis" :class="$q.screen.lt.sm ? 'text-body2' : ''">
            {{ currentChannelName }}
            <span v-if="currentUser" class="text-caption text-white text-opacity-70 q-ml-md">({{ currentUser.nickName }})</span>
          </span>
          <q-badge
            v-if="isCurrentChannelPrivate && $q.screen.gt.xs"
            color="amber"
            label="Súkromný"
            class="q-ml-sm"
          />
        </q-toolbar-title>

        <!-- Typing Indicator Component will go here -->
        <typing-indicator
          v-if="typingUsers.length > 0"
          :users="typingUsers"
        />

        <q-space />

        <!-- Members Toggle -->
        <q-btn
          flat
          dense
          round
          icon="group"
          @click="toggleRightDrawer"
          :size="$q.screen.lt.sm ? 'sm' : 'md'"
        >
          <q-badge v-if="onlineMembers > 0" color="positive" floating>
            {{ onlineMembers }}
          </q-badge>
          <q-tooltip>Členovia ({{ onlineMembers }}/{{ totalMembers }})</q-tooltip>
        </q-btn>
      </q-toolbar>
    </q-header>

    <!-- Left Drawer - Channels -->

    <q-drawer
      v-model="leftDrawerOpen"
      bordered
      :behavior="$q.screen.lt.sm ? 'mobile' : 'default'"
      :show-if-above="$q.screen.gt.lg"
      :width="$q.screen.lt.sm ? $q.screen.width : drawerWidth"
      :breakpoint="600"
      class="drawer-container"
    >
      <div class="column full-height no-wrap">
        <!-- Channel List - takes available space -->
        <div class="col overflow-hidden">
          <channel-list
            :channels="channels"
            :current-channel-id="currentChannelId"
            :current-user-id="currentUser?.id ?? null"
            @channel-selected="selectChannel"
            @channel-created="handleCreateChannel"
            @channel-left="handleLeaveChannel"
            @channel-deleted="handleDeleteChannel"
            @invitation-accepted="handleAcceptInvitation"
            @invitation-rejected="handleRejectInvitation"
            @close="$q.screen.lt.md && (leftDrawerOpen = false)"
          />
        </div>

        <!-- User Status -->
        <q-separator />
        <div class="col-auto bg-white">
          <user-status-menu
            v-if="currentUser"
            :current-user="currentUser"
            :user-status="userStatus"
            @status-changed="handleStatusChange"
            @logout="handleLogout"
          />
        </div>
      </div>
    </q-drawer>

    <!-- Right Drawer - Members -->
    <q-drawer
      v-model="rightDrawerOpen"
      side="right"
      bordered
      :behavior="$q.screen.lt.sm ? 'mobile' : 'default'"
      :width="$q.screen.lt.sm ? $q.screen.width : drawerWidth"
      :breakpoint="600"
      class="drawer-container"
    >
      <member-list :members="members" :is-admin="isChannelAdmin" :channel-id="currentChannelId || 0" @close="$q.screen.lt.md && (rightDrawerOpen = false)" />
    </q-drawer>

    <!-- Page Container for Messages - takes full space between drawers -->
    <q-page-container>
      <router-view
        v-if="currentChannelId && currentUser"
        :key="`channel-${currentChannelId}`"
        :channel-id="currentChannelId"
        :current-user="currentUser"
        :members="members"
        :channels="channels"
        @message-sent="handleMessageSent"
        @toggle-members-drawer="toggleRightDrawer"
        @channels-changed="handleChannelsChanged"
        @member-kicked="handleMemberKicked"
      />

      <!-- Empty state when no channel selected -->
      <q-page v-else-if="!currentChannelId" class="flex flex-center">
        <div class="text-center">
          <q-icon name="forum" size="80px" color="grey-5" />
          <div class="text-h6 text-grey-7 q-mt-md">Vyber kanál na začatie konverzácie</div>
        </div>
      </q-page>

      <!-- Loading state -->
      <q-page v-else class="flex flex-center">
        <q-spinner color="primary" size="50px" />
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import ChannelList from '../components/ChannelList.vue';
import TypingIndicatorChip from '../components/TypingIndicator.vue'
import MemberList from '../components/MemberList.vue';
import UserStatusMenu from '../components/UserStatus.vue';
import type { Channel, User, UserStatus, ChatMessage, TypingUser } from '../types';
import { getChannels, getCurrentUser, getInvitations, acceptInvitation, rejectInvitation, getChannelMembers, logout, joinChannel, leaveChannel, updateUserStatus, type MemberWithUser } from '../api'
import websocketService from '../services/websocket'
import notificationService from '../services/notificationService'

type ChannelWithMeta = Channel & {
  lastMessage?: string;
};

export default defineComponent({
  name: 'MainLayout',
  components: {
    TypingIndicator: TypingIndicatorChip,
    ChannelList,
    MemberList,
    UserStatusMenu
  },
  data() {
    return {
      leftDrawerOpen: true,
      rightDrawerOpen: false,
      currentUser: null as User | null,
      channels: [] as ChannelWithMeta[],
      currentChannelId: null as number | null,
      members: [] as MemberWithUser[],
      typingUsers: [] as TypingUser[],
      messageListenerUnsubscribe: null as (() => void) | null,
      userJoinedListenerUnsubscribe: null as (() => void) | null,
      userLeftListenerUnsubscribe: null as (() => void) | null,
      statusChangedListenerUnsubscribe: null as (() => void) | null,
    };
  },
  computed: {
    userStatus(): UserStatus {
      return this.currentUser?.status ?? 'offline'
    },
    currentChannel(): ChannelWithMeta | null {
      return this.channels.find((channel) => channel.id === this.currentChannelId) || null;
    },
    currentChannelName(): string {
      return this.currentChannel?.name || 'Vyber kanál';
    },
    isCurrentChannelPrivate(): boolean {
      return this.currentChannel?.isPrivate || false;
    },
    isChannelAdmin(): boolean {
      if (!this.currentUser) {
        return false;
      }
      return this.currentChannel?.adminId === this.currentUser.id;
    },
    onlineMembers(): number {
      return this.members.filter((member) => member.status === 'online').length;
    },
    totalMembers(): number {
      return this.members.length;
    },
    drawerWidth(): number {
    return this.$q.screen.gt.lg ? 400
         : this.$q.screen.gt.md ? 360
         : 260
    }
  },
  watch: {
    leftDrawerOpen(v: boolean) {
      if (v && this.$q.screen.lt.md) this.rightDrawerOpen = false
    },
    rightDrawerOpen(v: boolean) {
      if (v && this.$q.screen.lt.md) this.leftDrawerOpen = false
      },
    currentChannelId(newId: number | null) {
      if (newId) {
        this.loadChannelData(newId);
      }
    },
  },
  created() {
    console.log('MainLayout created')
    void this.initializeApp()
  },
  async mounted() {
    console.log('MainLayout mounted')

    // Connect WebSocket FIRST before loading data
    const token = localStorage.getItem('auth_token')
    if (token) {
      try {
        console.log('Connecting WebSocket with token...')
        await websocketService.connect(token)
        console.log('WebSocket connected successfully')

        // Setup notification listener for new messages
        this.setupNotificationListener()
        // Setup kick/ban and invite listeners
        this.setupKickBanListener()
        this.setupInviteListener()
        this.setupChannelDeletedListener()
        // Setup member join/leave listeners
        this.setupMemberJoinLeaveListeners()
        // Setup status change listener
        this.setupStatusChangeListener()
      } catch (error) {
        console.error('Failed to connect WebSocket:', error)
        this.$q.notify({
          type: 'negative',
          message: 'Nepodarilo sa pripojiť WebSocket',
          position: 'top'
        })
      }
    } else {
      console.log('No auth token found, skipping WebSocket connection')
    }

    // Now load data after WebSocket is ready
    await this.loadInitialData()
    // Listen for notification clicks to navigate to channel
    this.setupNotificationClickListener()
  },
  beforeUnmount() {
    // Clean up message listener
    if (this.messageListenerUnsubscribe) {
      this.messageListenerUnsubscribe()
    }

    // Clean up member join/leave listeners
    if (this.userJoinedListenerUnsubscribe) {
      this.userJoinedListenerUnsubscribe()
    }
    if (this.userLeftListenerUnsubscribe) {
      this.userLeftListenerUnsubscribe()
    }
    // Clean up status change listener
    if (this.statusChangedListenerUnsubscribe) {
      this.statusChangedListenerUnsubscribe()
    }

    // DON'T disconnect WebSocket here - it should stay connected across layouts
    // Only disconnect on logout (see handleLogout method)
  },
  methods: {
    async initializeApp(): Promise<void> {
      const token = localStorage.getItem('auth_token') || undefined
      if (token) {
        try {
          const user = await getCurrentUser(token)
          this.currentUser = { ...user, createdAt: new Date(), updatedAt: new Date() } as User
          console.log('currentUser set from API:', this.currentUser)
        } catch (err) {
          console.warn('Failed to load current user:', err)
        }
      }
    },

    async loadInitialData(): Promise<void> {
      const token = localStorage.getItem('auth_token') || undefined
      try {
        // Načítaj kanály a pozvánky
        const [channels, invitations] = await Promise.all([
          getChannels(token),
          getInvitations(token)
        ])

        // Označ pozvánky
        const invitationsWithFlag = invitations.map(inv => ({
          ...inv,
          isNewInvite: true
        }))

        // Spoj kanály a pozvánky
        this.channels = [...invitationsWithFlag, ...channels] as ChannelWithMeta[]
        console.log('Channels loaded from API:', this.channels.length)

        if (this.channels.length > 0 && !this.currentChannelId) {
          const firstChannel = this.channels[0]
          if (firstChannel) {
            this.selectChannel(firstChannel)
          }
        }
      } catch (err) {
        console.error('Failed loading channels from API:', err)
        // Leave channels empty — user can login to see channels
        this.channels = []
      }

      this.loadChannelMembers()
    },
    loadChannelData(channelId: number): void {
      this.$emit('channel-changed', channelId);
      this.loadChannelMembers(channelId);
    },
    loadChannelMembers(channelId?: number | null): void {
      const id = channelId ?? this.currentChannelId;
      if (!id) {
        return;
      }

      const token = localStorage.getItem('auth_token') || undefined
      getChannelMembers(id, token)
        .then((members: MemberWithUser[]) => {
          this.members = members;
        })
        .catch((err: Error) => {
          console.error('Failed to load members:', err);
          this.$q.notify({
            type: 'negative',
            message: 'Nepodarilo sa načítať členov kanála',
          });
          this.members = [];
        });
    },

    toggleLeftDrawer() {
      if (this.$q.screen.lt.sm) this.rightDrawerOpen = false
      this.leftDrawerOpen = !this.leftDrawerOpen
      },
    toggleRightDrawer() {
      if (this.$q.screen.lt.sm) this.leftDrawerOpen = false
      this.rightDrawerOpen = !this.rightDrawerOpen
    },
    selectChannel(channel: ChannelWithMeta): void {
      this.currentChannelId = channel.id;
      if (this.$q.screen.lt.sm) {
        this.leftDrawerOpen = false;
      }
      localStorage.setItem('currentChannelId', String(channel.id));
    },
    async handleLogout(): Promise<void> {
      const token = localStorage.getItem('auth_token') || undefined
      try {
        await logout(token)
      } catch (err) {
        console.error('Logout API error (continuing anyway):', err)
      }

      // Disconnect WebSocket
      websocketService.disconnect()

      // Clear local storage
      localStorage.removeItem('auth_token')
      localStorage.removeItem('currentChannelId')

      // Redirect to auth page
      void this.$router.push('/auth')
    },
    async handleStatusChange(newStatus: UserStatus): Promise<void> {
      if (!this.currentUser) return;

      const token = localStorage.getItem('auth_token') || undefined
      try {
        // Handle offline - first broadcast status, then disconnect WebSocket
        if (newStatus === 'offline') {
          // First broadcast offline status to all members via API
          await updateUserStatus(newStatus, token)
          // Then disconnect WebSocket
          websocketService.disconnect()
          // Update local state - currentUser
          this.currentUser.status = 'offline'
          // Update local state - myself in members list
          const myIndex = this.members.findIndex(m => m.id === this.currentUser?.id)
          if (myIndex !== -1) {
            const me = this.members[myIndex]!
            me.status = 'offline'
            this.members.splice(myIndex, 1, me)
          }
          return
        }

        // Handle online/dnd - reconnect WebSocket if disconnected
        if (!websocketService.connected && token) {
          await websocketService.connect(token)
          // Re-setup listeners after reconnect
          this.setupNotificationListener()
          this.setupKickBanListener()
          this.setupInviteListener()
          this.setupChannelDeletedListener()
          this.setupMemberJoinLeaveListeners()
          this.setupStatusChangeListener()
          // Reload channels and members
          await this.loadInitialData()

          // Force ChatPage to reload messages by toggling channel
          const savedChannelId = this.currentChannelId
          if (savedChannelId) {
            this.currentChannelId = null
            await this.$nextTick()
            this.currentChannelId = savedChannelId
            websocketService.joinChannel(savedChannelId)
          }
        }

        // Update status via API (for dnd/online - broadcasts via WebSocket)
        await updateUserStatus(newStatus, token)

        // Update local state - currentUser
        this.currentUser.status = newStatus;
        // Update local state - myself in members list
        const myIndex = this.members.findIndex(m => m.id === this.currentUser?.id)
        if (myIndex !== -1) {
          const me = this.members[myIndex]!
          me.status = newStatus
          this.members.splice(myIndex, 1, me)
        }
      } catch (error) {
        console.error('Failed to update status:', error)
        this.$q.notify({
          type: 'negative',
          message: 'Nepodarilo sa zmeniť status',
          position: 'top'
        })
      }
    },
    handleMessageSent(message: ChatMessage): void {
      console.log('Message sent:', message);
    },
    handleMemberKicked(userId: number): void {
      const index = this.members.findIndex(m => m.id === userId)
      if (index >= 0) {
        this.members.splice(index, 1)
      }
    },
    async handleChannelsChanged(): Promise<void> {
      // Clear current channel and reload (same as leave/delete handlers)
      this.currentChannelId = null
      this.members = []
      await this.loadInitialData()

      // Select first available channel
      const firstChannel = this.channels[0]
      if (firstChannel) {
        this.selectChannel(firstChannel)
      }
    },
    async handleAcceptInvitation(channel: Channel): Promise<void> {
      const token = localStorage.getItem('auth_token') || undefined
      try {
        await acceptInvitation(channel.id, token)
        this.$q.notify({
          type: 'positive',
          message: `Úspešne si sa pridal do kanála #${channel.name}`,
        })
        // Reload channels
        await this.loadInitialData()
      } catch (err) {
        console.error('Failed to accept invitation:', err)
        this.$q.notify({
          type: 'negative',
          message: 'Nepodarilo sa akceptovať pozvánku',
        })
      }
    },
    async handleRejectInvitation(channel: Channel): Promise<void> {
      const token = localStorage.getItem('auth_token') || undefined
      try {
        await rejectInvitation(channel.id, token)
        this.$q.notify({
          type: 'info',
          message: `Odmietnutá pozvánka do kanála #${channel.name}`,
        })
        // Remove from channels list
        this.channels = this.channels.filter(c => c.id !== channel.id)
      } catch (err) {
        console.error('Failed to reject invitation:', err)
        this.$q.notify({
          type: 'negative',
          message: 'Nepodarilo sa odmietnuť pozvánku',
        })
      }
    },
    async handleCreateChannel(data: { name: string; isPrivate: boolean }): Promise<void> {
      const token = localStorage.getItem('auth_token') || undefined
      try {
        await joinChannel(data.name, data.isPrivate, token)
        this.$q.notify({
          type: 'positive',
          message: `Kanál #${data.name} bol vytvorený`,
        })
        // Reload channels
        await this.loadInitialData()
        // Find and select the newly created channel
        const newChannel = this.channels.find(c => c.name === data.name)
        if (newChannel) {
          this.selectChannel(newChannel)
        }
      } catch (err) {
        console.error('Failed to create channel:', err)
        this.$q.notify({
          type: 'negative',
          message: err instanceof Error ? err.message : 'Nepodarilo sa vytvoriť kanál',
        })
      }
    },
    async handleLeaveChannel(channel: Channel): Promise<void> {
      const token = localStorage.getItem('auth_token') || undefined
      try {
        await leaveChannel(channel.id, undefined, false, token)
        this.$q.notify({
          type: 'positive',
          message: `Opustil si kanál #${channel.name}`,
        })

        // Clear current channel and reload
        this.currentChannelId = null
        this.members = []
        await this.loadInitialData()

        // Select first available channel
        const firstChannel = this.channels[0]
        if (firstChannel) {
          this.selectChannel(firstChannel)
        }
      } catch (err) {
        console.error('Failed to leave channel:', err)
        this.$q.notify({
          type: 'negative',
          message: err instanceof Error ? err.message : 'Nepodarilo sa opustiť kanál',
        })
      }
    },
    async handleDeleteChannel(channel: Channel): Promise<void> {
      const token = localStorage.getItem('auth_token') || undefined
      try {
        await leaveChannel(channel.id, undefined, true, token)
        this.$q.notify({
          type: 'positive',
          message: `Kanál #${channel.name} bol zmazaný`,
        })

        // Clear current channel and reload
        this.currentChannelId = null
        this.members = []
        await this.loadInitialData()

        // Select first available channel
        const firstChannel = this.channels[0]
        if (firstChannel) {
          this.selectChannel(firstChannel)
        }
      } catch (err) {
        console.error('Failed to delete channel:', err)
        this.$q.notify({
          type: 'negative',
          message: err instanceof Error ? err.message : 'Nepodarilo sa zmazať kanál',
        })
      }
    },
    setupNotificationListener(): void {
      // Clean up previous listener if exists
      if (this.messageListenerUnsubscribe) {
        this.messageListenerUnsubscribe()
      }

      // Počúvaj na nové správy cez WebSocket
      this.messageListenerUnsubscribe = websocketService.onMessage((message) => {
        console.log('Raw message from WS:', message)

        const isAppVisible = this.$q.appVisible
        console.log('App visibility ($q.appVisible):', isAppVisible)

        // Získaj user preferences
        const preferences = notificationService.getPreferences()
        console.log('User preferences from localStorage:', preferences)

        // Zisti názov kanála
        const channel = this.channels.find(c => c.id === message.channelId)
        const channelName = channel?.name || 'Neznámy kanál'

        // Skontroluj či máme currentUser
        if (!this.currentUser) { // ak je null alebo undefined
          console.warn('No current user, skipping notification')
          return
        }
        console.log('Current user:', {
          id: this.currentUser.id,
          nickName: this.currentUser.nickName,
          status: this.currentUser.status
        })

        const mentionedUserIds = message.mentionedUserIds || []
        const mentionsMe = mentionedUserIds.includes(this.currentUser.id)

        const enrichedMessage = { ...message, mentionsMe }

        // Rozhodnutie či notifikovať
        const shouldNotify = notificationService.shouldNotify(
          enrichedMessage,
          this.currentUser,
          preferences,
          isAppVisible,
          this.currentChannelId
        )

        console.log('Final decision:', shouldNotify ? 'SHOW NOTIFICATION' : 'NO NOTIFICATION')

        if (shouldNotify) {
          const payload = notificationService.createMessageNotification(enrichedMessage, channelName)
          console.log('Notification payload:', payload)

          const notification = notificationService.showNotification(payload)
          if (notification) {
            console.log('Notification shown successfully!')
          } else {
            console.error('Failed to show notification (permission issue?)')
          }
        }
      })
    },
    setupNotificationClickListener(): void {
      window.addEventListener('notification-clicked', (event: Event) => {
        const customEvent = event as CustomEvent<{ channelId: number }>
        const { channelId } = customEvent.detail

        // Nájdi kanál a prepni naň
        const channel = this.channels.find(c => c.id === channelId)
        if (channel) {
          this.selectChannel(channel)
        }
      })
    },
    setupKickBanListener(): void {
      websocketService.onUserKicked((event) => {
        console.log('User kicked event:', event)

        // Check if this event has channelName (means it's for ME - I was kicked)
        if (event.channelName) {
          // I WAS KICKED from this channel
          const channelId = Number(event.channelId)
          console.log('I was kicked from channel:', channelId)

          this.$q.notify({
            type: 'warning',
            message: `Bol si vykopnutý z kanála #${event.channelName}`,
            caption: event.reason,
            position: 'top',
            timeout: 5000
          })

          // Check if it was current channel
          const wasCurrentChannel = this.currentChannelId === channelId

          // Remove channel from list
          const channelIndex = this.channels.findIndex(c => c.id === channelId)
          if (channelIndex !== -1) {
            this.channels.splice(channelIndex, 1)
          }

          // If it was current channel, switch to another one
          if (wasCurrentChannel) {
            this.currentChannelId = null
            this.members = []

            void this.$nextTick(() => {
              if (this.channels.length > 0 && this.channels[0]) {
                this.selectChannel(this.channels[0])
              }
            })
          }
        } else {
          // SOMEONE ELSE was kicked from current channel
          // Update member list by removing the kicked user
          if (event.userId && this.currentChannelId === event.channelId) {
            console.log(`User ${event.nickName} was kicked from current channel`)

            const memberIndex = this.members.findIndex(m => m.id === event.userId)
            if (memberIndex >= 0) {
              this.members.splice(memberIndex, 1)
              console.log(`Removed ${event.nickName} from members list`)
            }

            // Show info notification
            this.$q.notify({
              type: 'info',
              message: `@${event.nickName} bol vykopnutý`,
              caption: event.reason,
              position: 'top',
              timeout: 3000
            })
          }
        }
      })
    },
    setupInviteListener(): void {
      websocketService.onChannelInvited((event) => {
        console.log('Received channel invitation:', event)

        // Show notification to user
        this.$q.notify({
          type: 'positive',
          message: `Bol si pozvaný do kanála #${event.channelName}`,
          caption: `Pozval ťa @${event.invitedBy}`,
          position: 'top',
          timeout: 5000,
          actions: [
            {
              label: 'Zobraziť pozvánky',
              color: 'white',
              handler: () => {
                // This will trigger the invitation dialog in ChannelList
                this.leftDrawerOpen = true
              }
            }
          ]
        })

        // Reload invitations in real-time
        void this.loadInitialData()
      })
    },
    setupChannelDeletedListener(): void {
      console.log('Setting up channel deleted listener...')
      websocketService.onChannelDeleted((event) => {
        console.log('Channel was deleted event received:', event)

        const channelId = Number(event.channelId)
        console.log('Channel ID (converted to number):', channelId, 'Current channel:', this.currentChannelId)

        // Show notification to user
        this.$q.notify({
          type: 'negative',
          message: `Kanál #${event.channelName} bol zmazaný`,
          caption: 'Admin zmazal kanál',
          position: 'top',
          timeout: 5000
        })

        // Check if deleted channel is current
        const wasCurrentChannel = this.currentChannelId === channelId
        console.log('Was current channel?', wasCurrentChannel)

        // Remove channel from list
        const channelIndex = this.channels.findIndex(c => c.id === channelId)
        console.log('Channel index found:', channelIndex)

        if (channelIndex !== -1) {
          console.log('Removing channel at index', channelIndex)
          this.channels.splice(channelIndex, 1)
          console.log('Channels after splice:', this.channels.length)
          this.$forceUpdate()
        } else {
          console.error('Channel not found in list even with number conversion!')
        }

        // If deleted channel was current, switch to another one
        if (wasCurrentChannel) {
          console.log('Preparing to switch to another channel...')
          this.currentChannelId = null
          this.members = []

          // Use nextTick to ensure channels list is updated first
          void this.$nextTick(() => {
            console.log('Inside nextTick - channels available:', this.channels.length)
            if (this.channels.length > 0 && this.channels[0]) {
              console.log('Switching to first available channel:', this.channels[0].name)
              this.selectChannel(this.channels[0])
            } else {
              console.log('No channels left after deletion')
            }
          })
        } else {
          console.log('Not current channel, no need to switch')
        }
      })
      console.log('Channel deleted listener set up successfully')

      // Listen for kick vote updates
      websocketService.onKickVoteUpdate((event) => {
        console.log('Kick vote updated:', event)

        // Only update if we're in the same channel
        if (this.currentChannelId !== event.channelId) return

        // Update the member's kickVotes count and voters list
        const member = this.members.find(m => m.id === event.userId)
        if (member) {
          member.kickVotes = event.kickVotes
          member.kickVoters = event.kickVoters
          this.$forceUpdate() // Force re-render to update computed properties

          this.$q.notify({
            type: 'info',
            message: `Hlas pre vyhodenie @${event.nickName} zaznamenaný (${event.kickVotes}/3)`,
            caption: `Od: ${event.votedBy}`,
            position: 'top',
            timeout: 3000
          })
        }
      })
    },
    setupMemberJoinLeaveListeners(): void {
      // Listen for users joining the channel
      this.userJoinedListenerUnsubscribe = websocketService.onUserJoined((event) => {
        console.log('User joined channel:', event)

        // Only update if we're in the current channel
        if (!this.currentChannelId) return

        // Check if user is already in members list
        const existingMember = this.members.find(m => m.id === event.userId)
        if (existingMember) {
          console.log('User already in members list, skipping')
          return
        }

        // Reload members for current channel to get full user data
        this.loadChannelMembers(this.currentChannelId)
      })

      // Listen for users leaving the channel
      this.userLeftListenerUnsubscribe = websocketService.onUserLeft((event) => {
        console.log('User left channel:', event)

        // Only update if we're in the current channel
        if (!this.currentChannelId) return

        // Remove user from members list
        const index = this.members.findIndex(m => m.id === event.userId)
        if (index >= 0) {
          this.members.splice(index, 1)
          console.log(`Removed user ${event.nickName} from members list`)
        }
      })
    },
    setupStatusChangeListener(): void {
      // Listen for status changes from other users
      this.statusChangedListenerUnsubscribe = websocketService.onStatusChanged((event) => {
        console.log('User status changed:', event)
        console.log('Current members:', this.members.map(m => ({ id: m.id, nickName: m.nickName, status: m.status })))

        // Update in members list - use splice for Vue reactivity
        const memberIndex = this.members.findIndex(m => m.id === event.userId)
        if (memberIndex !== -1) {
          // Update status directly on the member and trigger reactivity with splice
          const member = this.members[memberIndex]!
          member.status = event.status
          this.members.splice(memberIndex, 1, member)
          console.log(`Updated status of ${event.nickName} to ${event.status}`)
        } else {
          console.log(`Member with id ${event.userId} not found in members list`)
        }

        // Update currentUser if it's the same user (shouldn't happen often as we update locally too)
        if (this.currentUser && this.currentUser.id === event.userId) {
          this.currentUser.status = event.status
        }
      })
    },
  },
});
</script>

<style scoped>
.drawer-container {
  overflow-x: hidden !important;
}

.drawer-container :deep(.q-drawer__content) {
  overflow-x: hidden !important;
}
</style>
