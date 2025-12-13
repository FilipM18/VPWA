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
import type { UserStatus } from '../types';
import type { MemberWithUser } from '../api';
import { kickMember } from '../api';
import { mockUsers } from '../utils/mockData';

export default defineComponent({
  name: 'MemberList',
  components: {
    MemberItem,
  },
  props: {
    members: {
      type: Array as PropType<MemberWithUser[]>,
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
    channelId: {
      type: Number,
      required: false,
    },
  },
  emits: ['close'],
  data() {
    return {
      search: '',
      mockUsers,
      showVoteKickDialog: false,
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
    activeVoteKicks(): Array<{ userId: number; userName: string; votes: number; required: number; hasVoted: boolean }> {
      return this.members
        .filter(m => m.kickVotes > 0)
        .map(m => ({
          userId: m.id,
          userName: m.nickName,
          votes: m.kickVotes,
          required: 3,
          hasVoted: this.currentUserId ? m.kickVoters.includes(this.currentUserId) : false,
        }));
    },
    filteredMembers(): MemberWithUser[] {
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
    onlineMembers(): MemberWithUser[] {
      return this.filteredMembers.filter((member) => member.status === 'online');
    },
    dndMembers(): MemberWithUser[] {
      return this.filteredMembers.filter((member) => member.status === 'dnd');
    },
    offlineMembers(): MemberWithUser[] {
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
        if (!this.channelId) {
          this.$q.notify({
            type: 'negative',
            message: 'Chyba: Kanál nebol nájdený',
            position: 'top',
          });
          return;
        }

        const token = localStorage.getItem('auth_token') || undefined;
        
        kickMember(this.channelId, vote.userName, token)
          .then((result) => {
            this.$q.notify({
              type: 'positive',
              message: result.message,
              position: 'top',
            });

            // If user was banned, they'll be removed via websocket event
            // If it's just a vote, the member list will be updated via websocket
          })
          .catch((error) => {
            console.error('Failed to vote for kick:', error);
            this.$q.notify({
              type: 'negative',
              message: error instanceof Error ? error.message : 'Nepodarilo sa zahlasovať',
              position: 'top',
            });
          });
      });
    },
  },
});
</script>

<style scoped>
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
