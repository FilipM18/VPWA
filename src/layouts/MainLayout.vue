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
      <member-list :members="members" :is-admin="isChannelAdmin" @close="$q.screen.lt.md && (rightDrawerOpen = false)" />
    </q-drawer>

    <!-- Page Container for Messages - takes full space between drawers -->
    <q-page-container>
      <router-view
        v-if="currentChannelId && currentUser"
        :channel-id="currentChannelId"
        :current-user="currentUser"
        :members="members"
        @message-sent="handleMessageSent"
        @toggle-members-drawer="toggleRightDrawer"
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
import type { Channel, User, UserStatus, ChatMessage, TypingIndicator as TypingIndicatorType } from '../types';
import { getChannels, getCurrentUser, getInvitations, acceptInvitation, rejectInvitation, getChannelMembers } from '../api'
import websocketService from '../services/websocket'

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
      members: [] as User[],
      typingUsers: [] as TypingIndicatorType[],
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
  },
  beforeUnmount() {
    // Disconnect WebSocket when layout unmounts
    websocketService.disconnect()
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
        .then((members: User[]) => {
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
    handleLogout(): void {
      //this.$router.push('/auth')
    },
    handleStatusChange(newStatus: UserStatus): void {
      if (this.currentUser) {
        this.currentUser.status = newStatus;
      }
    },
    handleMessageSent(message: ChatMessage): void {
      console.log('Message sent:', message);
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
