<template>
  <q-item clickable v-ripple @click="$emit('view-profile', member)" :class="itemClasses">
    <q-item-section avatar>
      <q-avatar :color="avatarColor" text-color="white" size="36px">
        {{ member.nickName.charAt(0).toUpperCase() }}
        <q-badge v-if="member.status === 'online'" color="positive" floating rounded />
        <q-badge v-else-if="member.status === 'dnd'" color="warning" floating rounded />
      </q-avatar>
    </q-item-section>

    <q-item-section>
      <q-item-label>
        {{ member.nickName }}
        <q-badge v-if="isCurrentUser" color="blue-grey-5" label="ty" class="q-ml-xs" />
      </q-item-label>
      <q-item-label caption> {{ member.firstName }} {{ member.lastName }} </q-item-label>
    </q-item-section>

    <q-item-section side v-if="showActions && !isCurrentUser">
      <q-btn flat dense round icon="more_horiz" size="sm" @click.stop>
        <q-menu auto-close>
          <q-list dense>
            <q-item clickable @click="$emit('mention', member)">
              <q-item-section avatar>
                <q-icon name="alternate_email" size="sm" />
              </q-item-section>
              <q-item-section>@Spomenúť</q-item-section>
            </q-item>

            <template v-if="isAdmin">
              <q-separator />
              <q-item clickable @click="$emit('kick', member)" class="text-negative">
                <q-item-section avatar>
                  <q-icon name="person_remove" size="sm" />
                </q-item-section>
                <q-item-section>Vyhodiť</q-item-section>
              </q-item>
            </template>
          </q-list>
        </q-menu>
      </q-btn>
    </q-item-section>
  </q-item>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import type { User } from '../types';

export default defineComponent({
  name: 'MemberItem',
  props: {
    member: {
      type: Object as PropType<User>,
      required: true,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    isCurrentUser: {
      type: Boolean,
      default: false,
    },
    showActions: {
      type: Boolean,
      default: true,
    },
  },
  emits: ['kick', 'mention', 'view-profile'],
  computed: {
    itemClasses(): Array<string | Record<string, boolean>> {
      return [
        'rounded-borders',
        'q-mb-xs',
        {
          'opacity-50': this.member.status === 'offline',
        },
      ];
    },
    avatarColor(): string {
      if (this.member.status === 'offline') {
        return 'grey-4';
      }
      const colors = ['primary', 'secondary', 'accent', 'positive', 'info', 'warning'];
      const hash = this.member.nickName
        .split('')
        .reduce((accumulator, character) => accumulator + character.charCodeAt(0), 0);
      return colors[hash % colors.length] ?? 'primary';
    },
  },
});
</script>
