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
          </span>
          <q-badge
            v-if="isCurrentChannelPrivate && $q.screen.gt.xs"
            color="amber"
            label="Súkromný"
            class="q-ml-sm"
          />
        </q-toolbar-title>

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
      :breakpoint="1024"
    >
      <div class="column full-height">
        <!-- Channel List - takes available space -->
        <div class="col overflow-hidden">
          <channel-list
            :channels="channels"
            :current-channel-id="currentChannelId"
            @channel-selected="selectChannel"
            @close="$q.screen.lt.md && (leftDrawerOpen = false)"
          />
        </div>

        <!-- User Status - fixed at bottom -->
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
      :breakpoint="1024"
    >
      <member-list :members="members" :is-admin="isChannelAdmin" @close="$q.screen.lt.md && (rightDrawerOpen = false)" />
    </q-drawer>

    <!-- Page Container for Messages - takes full space between drawers -->
    <q-page-container>
      <router-view
        v-if="currentChannelId"
        :channel-id="currentChannelId"
        :current-user="currentUser"
        :members="members"
        @message-sent="handleMessageSent"
      />

      <!-- Empty state when no channel selected -->
      <q-page v-else class="flex flex-center">
        <div class="text-center">
          <q-icon name="forum" size="80px" color="grey-5" />
          <div class="text-h6 text-grey-7 q-mt-md">Vyber kanál na začatie konverzácie</div>
        </div>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import ChannelList from '../components/ChannelList.vue';
import MemberList from '../components/MemberList.vue';
import UserStatusMenu from '../components/UserStatus.vue';
import type { Channel, User, UserStatus, ChatMessage } from '../types';
type ChannelWithMeta = Channel & {
  lastMessage?: string;
};

export default defineComponent({
  name: 'MainLayout',
  components: {
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
    return this.$q.screen.gt.lg ? 300
         : this.$q.screen.gt.md ? 280
         : 260
    }
  },
  watch: {
    leftDrawerOpen(v: boolean) {
      if (v && this.$q.screen.lt.sm) this.rightDrawerOpen = false
    },
    rightDrawerOpen(v: boolean) {
      if (v && this.$q.screen.lt.sm) this.leftDrawerOpen = false
      },
    currentChannelId(newId: number | null) {
      if (newId) {
        this.loadChannelData(newId);
      }
    },
  },
  created() {
    this.initializeApp();
  },
  mounted() {
    this.loadInitialData();

  },
  methods: {
    initializeApp(): void {
      const defaultUser: User = {
        id: 1,
        nickName: 'TestUser',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        status: 'online',
      };
      this.currentUser = defaultUser;
    },
    loadInitialData(): void {
      const defaultChannels: ChannelWithMeta[] = [
        {
          id: 1,
          name: 'general',
          isPrivate: false,
          adminId: this.currentUser?.id || 1,
          createdAt: new Date(),
          lastActivityAt: new Date(),
          unreadCount: 0,
        },
        {
          id: 2,
          name: 'random',
          isPrivate: false,
          adminId: this.currentUser?.id || 1,
          createdAt: new Date(),
          lastActivityAt: new Date(),
          unreadCount: 0,
        },
      ];
      this.channels = defaultChannels;

      if (this.channels.length > 0 && !this.currentChannelId) {
        const firstChannel = this.channels[0];
        if (firstChannel) {
          this.selectChannel(firstChannel);
        }
      }
      this.loadChannelMembers();
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
      const defaultMembers: User[] = [
        {
          id: this.currentUser?.id || 1,
          nickName: this.currentUser?.nickName || 'TestUser',
          firstName: this.currentUser?.firstName || 'Test',
          lastName: this.currentUser?.lastName || 'User',
          email: this.currentUser?.email || 'test@example.com',
          status: this.currentUser?.status || 'online',
        },
        {
          id: 2,
          nickName: 'Eva',
          firstName: 'Eva',
          lastName: 'Nováková',
          email: 'eva@example.com',
          status: 'online',
        },
        {
          id: 3,
          nickName: 'Peter',
          firstName: 'Peter',
          lastName: 'Horváth',
          email: 'peter@example.com',
          status: 'dnd',
        },
      ];
      this.members = defaultMembers;
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
  },
});
</script>
