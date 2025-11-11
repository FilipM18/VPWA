<template>
  <div class="column no-wrap full-height">
    <!-- Header -->
    <q-toolbar class="bg-grey-2">
      <q-icon name="group" class="q-mr-sm" />
      <q-toolbar-title> Členovia ({{ totalMembers }}) </q-toolbar-title>

      <!-- Vote Kick Button -->
      <q-btn
        v-if="activeVoteKicks.length > 0"
        flat
        dense
        round
        icon="how_to_vote"
        color="warning"
        @click="showVoteKickDialog = true"
      >
        <q-badge color="red" floating>{{ activeVoteKicks.length }}</q-badge>
        <q-tooltip>Aktívne hlasovania ({{ activeVoteKicks.length }})</q-tooltip>
      </q-btn>

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
            <q-badge color="red" rounded class="dnd-icon-badge">
              <q-icon name="remove" size="8px" color="white" />
            </q-badge>
            <span class="q-ml-xs">Nerušiť ({{ dndMembers.length }})</span>
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

    <!-- Vote Kick Dialog -->
    <q-dialog v-model="showVoteKickDialog">
      <q-card style="min-width: 350px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">
            <q-icon name="how_to_vote" color="warning" class="q-mr-sm" />
            Aktívne hlasovania
          </div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <q-list separator>
            <q-item v-for="vote in activeVoteKicks" :key="vote.userId">
              <q-item-section avatar>
                <q-avatar color="grey" text-color="white">
                  {{ vote.userName.charAt(0).toUpperCase() }}
                </q-avatar>
              </q-item-section>

              <q-item-section>
                <q-item-label>{{ vote.userName }}</q-item-label>
                <q-item-label caption>
                  Hlasovali: {{ vote.votes }}/{{ vote.required }}
                </q-item-label>
                <q-linear-progress
                  :value="vote.votes / vote.required"
                  color="warning"
                  class="q-mt-xs"
                />
              </q-item-section>

              <q-item-section side>
                <q-btn
                  v-if="!vote.hasVoted"
                  flat
                  dense
                  color="warning"
                  label="Hlasovať"
                  @click="voteForKick(vote)"
                />
                <q-chip v-else color="grey" text-color="white" dense>
                  <q-icon name="check" size="xs" class="q-mr-xs" />
                  Hlasovali ste
                </q-chip>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
      </q-card>
    </q-dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import MemberItem from './MemberItem.vue';
import type { User, UserStatus } from '../types';
import { mockUsers } from '../utils/mockData';

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
      mockUsers,
      showVoteKickDialog: false,
      activeVoteKicks: [
        {
          userId: 6,
          userName: 'Tomáš Kováč',
          votes: 1,
          required: 3,
          hasVoted: false,
        },
                {
          userId: 6,
          userName: 'Tomáš Kováč',
          votes: 1,
          required: 3,
          hasVoted: false,
        },
                {
          userId: 6,
          userName: 'Tomáš Kováč',
          votes: 1,
          required: 3,
          hasVoted: false,
        }
      ],
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
    voteForKick(vote: { userId: number; userName: string; votes: number; required: number; hasVoted: boolean }): void {
      this.$q.dialog({
        title: 'Potvrdiť hlasovanie',
        message: `Naozaj chcete hlasovať za vyhodenie používateľa ${vote.userName}?`,
        cancel: {
          label: 'Zrušiť',
          flat: true,
        },
        ok: {
          label: 'Hlasovať',
          color: 'warning',
        },
      }).onOk(() => {
        // Update the vote
        vote.hasVoted = true;
        vote.votes++;
        
        this.$q.notify({
          type: 'positive',
          message: `Hlasovali ste za vyhodenie používateľa ${vote.userName}.`,
          position: 'top',
        });

        // Check if vote passed
        if (vote.votes >= vote.required) {
          this.$q.notify({
            type: 'warning',
            message: `Hlasovanie o vyhodení používateľa ${vote.userName} bolo úspešné!`,
            position: 'top',
          });
          // Remove from active votes
          const index = this.activeVoteKicks.findIndex(v => v.userId === vote.userId);
          if (index > -1) {
            this.activeVoteKicks.splice(index, 1);
          }
        }
      });
    },
  },
});
</script>

<style scoped>
.column {
  overflow-x: hidden;
  max-width: 100%;
}

.q-toolbar {
  max-width: 100%;
  overflow: hidden;
}

.q-toolbar-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.q-pa-sm {
  padding: 8px !important;
}

.q-input {
  max-width: 100%;
}

.q-item {
  max-width: 100%;
  padding-left: 12px;
  padding-right: 12px;
}

.q-item-section {
  min-width: 0;
}

.q-item-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dnd-icon-badge {
  width: 16px !important;
  height: 16px !important;
  min-width: 16px !important;
  min-height: 16px !important;
  padding: 0 !important;
  display: inline-flex !important;
  align-items: center;
  justify-content: center;
  vertical-align: middle;
}
</style>
