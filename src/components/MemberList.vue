<template>
  <div class="column no-wrap full-height">
    <!-- Header -->
    <q-toolbar class="bg-grey-2">
      <q-icon name="group" class="q-mr-sm" />
      <q-toolbar-title> Členovia ({{ totalMembers }}) </q-toolbar-title>

      <!-- Close button for mobile -->
      <q-btn v-show="$q.screen.lt.sm" flat dense round icon="close" @click="$emit('close')">
        <q-tooltip>Zavrieť</q-tooltip>
      </q-btn>
    </q-toolbar>

    <!-- Search -->
    <div class="q-pa-sm">
      <q-input v-model="search" filled dense placeholder="Hľadať členov...">
        <template v-slot:prepend>
          <q-icon name="search" />
        </template>
        <template v-slot:append v-if="search">
          <q-icon name="close" @click="search = ''" class="cursor-pointer" />
        </template>
      </q-input>
    </div>

    <q-separator />

    <!-- Members List -->
    <q-scroll-area class="col">
      <q-list padding>
        <!-- Online Members -->
        <template v-if="onlineMembers.length > 0">
          <q-item-label header class="text-weight-bold">
            <q-icon name="circle" color="positive" size="xs" class="q-mr-xs" />
            Online ({{ onlineMembers.length }})
          </q-item-label>

          <member-item
            v-for="member in onlineMembers"
            :key="`online-${member.id}`"
            :member="member"
            :is-admin="isAdmin"
            :is-current-user="member.id === currentUserId"
          />
        </template>

        <!-- DND Members -->
        <template v-if="dndMembers.length > 0">
          <q-item-label header class="text-weight-bold q-mt-md">
            <q-icon name="do_not_disturb_on" color="warning" size="xs" class="q-mr-xs" />
            Nerušiť ({{ dndMembers.length }})
          </q-item-label>

          <member-item
            v-for="member in dndMembers"
            :key="`dnd-${member.id}`"
            :member="member"
            :is-admin="isAdmin"
            :is-current-user="member.id === currentUserId"
          />
        </template>

        <!-- Offline Members -->
        <template v-if="offlineMembers.length > 0">
          <q-item-label header class="text-weight-bold q-mt-md">
            <q-icon name="radio_button_unchecked" color="grey" size="xs" class="q-mr-xs" />
            Offline ({{ offlineMembers.length }})
          </q-item-label>

          <member-item
            v-for="member in offlineMembers"
            :key="`offline-${member.id}`"
            :member="member"
            :is-admin="isAdmin"
            :is-current-user="member.id === currentUserId"
            :show-actions="false"
          />
        </template>

        <!-- Empty State -->
        <div v-if="filteredMembers.length === 0" class="text-center q-pa-xl">
          <q-icon name="group_off" size="60px" color="grey-5" />
          <div class="text-subtitle1 text-grey-7 q-mt-md">
            {{ search ? 'Žiadni členovia nenájdení' : 'Žiadni členovia v kanáli' }}
          </div>
        </div>
      </q-list>
    </q-scroll-area>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import MemberItem from './MemberItem.vue';
import type { User, UserStatus } from '../types';

export default defineComponent({
  name: 'MemberList',
  components: {
    MemberItem,
  },
  props: {
    members: {
      type: Array as PropType<User[]>,
      default: () => [],
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    isPrivateChannel: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['close'],
  data() {
    return {
      search: '',
    };
  },
  computed: {
    currentUserId(): number | null {
      const userRaw = localStorage.getItem('currentUser');
      if (!userRaw) {
        return null;
      }
      try {
        const parsed = JSON.parse(userRaw) as { id?: number };
        return typeof parsed.id === 'number' ? parsed.id : null;
      } catch (error) {
        console.error('Failed to parse currentUser', error);
        return null;
      }
    },
    filteredMembers(): User[] {
      if (!this.search) {
        return this.members;
      }
      const searchLower = this.search.toLowerCase();
      return this.members.filter((member) => {
        const nick = member.nickName.toLowerCase();
        const first = member.firstName.toLowerCase();
        const last = member.lastName.toLowerCase();
        return (
          nick.includes(searchLower) || first.includes(searchLower) || last.includes(searchLower)
        );
      });
    },
    onlineMembers(): User[] {
      return this.filteredMembers.filter((member) => member.status === 'online');
    },
    dndMembers(): User[] {
      return this.filteredMembers.filter((member) => member.status === 'dnd');
    },
    offlineMembers(): User[] {
      return this.filteredMembers.filter((member) => member.status === 'offline');
    },
    totalMembers(): number {
      return this.members.length;
    },
  },
  methods: {
    getStatusText(status: UserStatus): string {
      switch (status) {
        case 'online':
          return 'Online';
        case 'dnd':
          return 'Nerušiť';
        case 'offline':
          return 'Offline';
        default:
          return 'Neznámy';
      }
    },
  },
});
</script>

