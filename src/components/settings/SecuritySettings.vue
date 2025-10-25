<template>
  <div class="security-settings">
    <div class="text-h5 text-weight-bold q-mb-lg">Bezpečnosť a prihlásenie</div>

    <!-- Password Change Section -->
    <q-card flat bordered class="q-mb-md">
      <q-card-section>
        <div class="text-subtitle1 text-weight-medium q-mb-md">Zmena hesla</div>
        <q-form @submit.prevent="handlePasswordChange" class="q-gutter-md">
          <q-input
            v-model="passwordForm.currentPassword"
            type="password"
            outlined
            label="Aktuálne heslo"
            :rules="[val => !!val || 'Zadajte aktuálne heslo']"
          >
            <template v-slot:prepend>
              <q-icon name="lock" />
            </template>
          </q-input>

          <q-input
            v-model="passwordForm.newPassword"
            :type="showNewPassword ? 'text' : 'password'"
            outlined
            label="Nové heslo"
            :rules="[
              val => !!val || 'Zadajte nové heslo',
              val => val.length >= 8 || 'Heslo musí obsahovať aspoň 8 znakov'
            ]"
          >
            <template v-slot:prepend>
              <q-icon name="lock" />
            </template>
            <template v-slot:append>
              <q-icon
                :name="showNewPassword ? 'visibility_off' : 'visibility'"
                class="cursor-pointer"
                @click="showNewPassword = !showNewPassword"
              />
            </template>
          </q-input>

          <q-input
            v-model="passwordForm.confirmPassword"
            :type="showConfirmPassword ? 'text' : 'password'"
            outlined
            label="Potvrďte nové heslo"
            :rules="[
              val => !!val || 'Potvrďte nové heslo',
              val => val === passwordForm.newPassword || 'Heslá sa nezhodujú'
            ]"
          >
            <template v-slot:prepend>
              <q-icon name="lock" />
            </template>
            <template v-slot:append>
              <q-icon
                :name="showConfirmPassword ? 'visibility_off' : 'visibility'"
                class="cursor-pointer"
                @click="showConfirmPassword = !showConfirmPassword"
              />
            </template>
          </q-input>

          <!-- Password strength indicator -->
          <div v-if="passwordForm.newPassword" class="q-mb-md">
            <div class="text-caption text-grey-7 q-mb-xs">Sila hesla</div>
            <q-linear-progress
              :value="passwordStrength / 100"
              :color="passwordStrengthColor"
              size="8px"
              rounded
            />
            <div class="text-caption q-mt-xs" :class="`text-${passwordStrengthColor}`">
              {{ passwordStrengthText }}
            </div>
          </div>

          <div class="row justify-end q-gutter-sm">
            <q-btn
              flat
              label="Zrušiť"
              @click="resetPasswordForm"
            />
            <q-btn
              unelevated
              color="primary"
              label="Zmeniť heslo"
              type="submit"
            />
          </div>
        </q-form>
      </q-card-section>
    </q-card>

    <!-- Account Info -->
    <q-card flat bordered>
      <q-card-section>
        <div class="text-subtitle1 text-weight-medium q-mb-md">Informácie o účte</div>
        <q-list>
          <q-item>
            <q-item-section>
              <q-item-label caption>E-mailová adresa</q-item-label>
              <q-item-label>{{ currentUser.email || 'neuvedené' }}</q-item-label>
            </q-item-section>
          </q-item>
          <q-separator inset />
          <q-item>
            <q-item-section>
              <q-item-label caption>Účet vytvorený</q-item-label>
              <q-item-label>{{ formatDate(currentUser.createdAt) }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>
    </q-card>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import type { User } from '../../types';

export default defineComponent({
  name: 'SecuritySettings',
  props: {
    currentUser: {
      type: Object as PropType<User>,
      required: true
    }
  },
  emits: ['update-password'],
  data() {
    return {
      passwordForm: {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      },
      showNewPassword: false,
      showConfirmPassword: false
    };
  },
  computed: {
    passwordStrength(): number {
      const password = this.passwordForm.newPassword;
      if (!password) return 0;
      
      let strength = 0;
      if (password.length >= 8) strength += 25;
      if (password.length >= 12) strength += 25;
      if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
      if (/\d/.test(password)) strength += 15;
      if (/[!@#$%^&*]/.test(password)) strength += 10;
      
      return Math.min(100, strength);
    },
    passwordStrengthColor(): string {
      const strength = this.passwordStrength;
      if (strength < 40) return 'negative';
      if (strength < 70) return 'warning';
      return 'positive';
    },
    passwordStrengthText(): string {
      const strength = this.passwordStrength;
      if (strength < 40) return 'Slabé';
      if (strength < 70) return 'Stredné';
      return 'Silné';
    }
  },
  methods: {
    handlePasswordChange(): void {
      console.log('Password change requested (static - no backend)');
      this.$emit('update-password', {
        currentPassword: this.passwordForm.currentPassword,
        newPassword: this.passwordForm.newPassword
      });
      this.resetPasswordForm();
    },

    resetPasswordForm(): void {
      this.passwordForm = {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      };
    },

    formatDate(date?: Date): string {
      if (!date) return 'Neuvedené';
      return new Date(date).toLocaleDateString('sk-SK', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  }
});
</script>