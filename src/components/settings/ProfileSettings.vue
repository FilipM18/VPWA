<template>
  <div class="profile-settings">
    <div class="text-h5 text-weight-bold q-mb-lg">Môj účet</div>

    <!-- Avatar Section -->
    <q-card flat bordered class="q-mb-md">
      <q-card-section>
        <div class="text-subtitle1 text-weight-medium q-mb-md">Profilový obrázok</div>
        <div class="row items-center q-gutter-md">
          <q-avatar size="80px" color="primary" text-color="white">
            <img v-if="avatarUrl" :src="avatarUrl" />
            <span v-else class="text-h4">{{ userInitials }}</span>
          </q-avatar>
          <div>
            <q-btn
              outline
              color="primary"
              label="Zmeniť avatar"
              icon="upload"
              @click="openFileInput"
            />
            <input
              ref="fileInput"
              type="file"
              accept="image/*"
              style="display: none"
              @change="handleAvatarChange"
            />
            <div class="text-caption text-grey-7 q-mt-sm">
              PNG, JPG alebo GIF. Max 2MB.
            </div>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- User Info Section -->
    <q-card flat bordered class="q-mb-md">
      <q-card-section>
        <div class="text-subtitle1 text-weight-medium q-mb-md">Osobné informácie</div>
        
        <div class="row q-col-gutter-md q-mb-md">
          <div class="col-12 col-sm-6">
            <q-input
              v-model="editedUser.firstName"
              outlined
              label="Meno"
              :rules="[val => !!val || 'Zadajte meno']"
            >
              <template v-slot:prepend>
                <q-icon name="person" />
              </template>
            </q-input>
          </div>
          <div class="col-12 col-sm-6">
            <q-input
              v-model="editedUser.lastName"
              outlined
              label="Priezvisko"
              :rules="[val => !!val || 'Zadajte priezvisko']"
            >
              <template v-slot:prepend>
                <q-icon name="person" />
              </template>
            </q-input>
          </div>
        </div>

        <q-input
          v-model="editedUser.nickName"
          outlined
          label="Používateľské meno (nickname)"
          :rules="[val => !!val || 'Zadajte nickname']"
          class="q-mb-md"
        >
          <template v-slot:prepend>
            <q-icon name="alternate_email" />
          </template>
        </q-input>

        <q-input
          v-model="editedUser.email"
          outlined
          label="Email"
          type="email"
          :rules="[
            val => !!val || 'Zadajte email',
            val => /.+@.+\..+/.test(val) || 'Neplatný email'
          ]"
          class="q-mb-md"
        >
          <template v-slot:prepend>
            <q-icon name="email" />
          </template>
        </q-input>

        <div class="row justify-end q-gutter-sm">
          <q-btn
            flat
            label="Zrušiť"
            @click="resetForm"
          />
          <q-btn
            unelevated
            color="primary"
            label="Uložiť zmeny"
            @click="saveProfile"
          />
        </div>
      </q-card-section>
    </q-card>

    <!-- Status Section -->
    <q-card flat bordered>
      <q-card-section>
        <div class="text-subtitle1 text-weight-medium q-mb-md">Stav dostupnosti</div>
        <div class="text-caption text-grey-7 q-mb-md">
          Váš stav je viditeľný ostatným používateľom
        </div>

        <q-list>
          <q-item
            clickable
            v-ripple
            @click="updateStatus('online')"
            :active="editedUser.status === 'online'"
            active-class="bg-grey-2"
            class="rounded-borders"
          >
            <q-item-section avatar>
              <q-icon name="circle" color="positive" size="sm" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Online</q-item-label>
              <q-item-label caption>Ste dostupný pre konverzácie</q-item-label>
            </q-item-section>
            <q-item-section side v-if="editedUser.status === 'online'">
              <q-icon name="check" color="primary" />
            </q-item-section>
          </q-item>

          <q-item
            clickable
            v-ripple
            @click="updateStatus('dnd')"
            :active="editedUser.status === 'dnd'"
            active-class="bg-grey-2"
            class="rounded-borders"
          >
            <q-item-section avatar>
              <q-icon name="do_not_disturb_on" color="warning" size="sm" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Nerušiť (DND)</q-item-label>
              <q-item-label caption>Notifikácie sú vypnuté</q-item-label>
            </q-item-section>
            <q-item-section side v-if="editedUser.status === 'dnd'">
              <q-icon name="check" color="primary" />
            </q-item-section>
          </q-item>

          <q-item
            clickable
            v-ripple
            @click="updateStatus('offline')"
            :active="editedUser.status === 'offline'"
            active-class="bg-grey-2"
            class="rounded-borders"
          >
            <q-item-section avatar>
              <q-icon name="radio_button_unchecked" color="grey" size="sm" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Offline</q-item-label>
              <q-item-label caption>Správy sa nebudú zobrazovať v reálnom čase</q-item-label>
            </q-item-section>
            <q-item-section side v-if="editedUser.status === 'offline'">
              <q-icon name="check" color="primary" />
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>
    </q-card>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import type { User, UserStatus } from '../../types';

export default defineComponent({
  name: 'ProfileSettings',
  props: {
    currentUser: {
      type: Object as PropType<User>,
      required: true
    }
  },
  emits: ['update-profile'],
  data() {
    return {
      avatarUrl: this.currentUser.avatarUrl || '',
      editedUser: {
        firstName: this.currentUser.firstName,
        lastName: this.currentUser.lastName,
        nickName: this.currentUser.nickName,
        email: this.currentUser.email,
        status: this.currentUser.status,
        avatarUrl: this.currentUser.avatarUrl
      }
    };
  },
  computed: {
    userInitials(): string {
      const first = this.currentUser.firstName?.[0] || '';
      const last = this.currentUser.lastName?.[0] || '';
      return (first + last).toUpperCase() || 'U';
    }
  },
  methods: {
    handleAvatarChange(event: Event): void {
      const target = event.target as HTMLInputElement;
      const file = target.files?.[0];
      
      if (!file) return;

      if (file.size > 2 * 1024 * 1024) {
        this.$q.notify({
          type: 'negative',
          message: 'Obrázok je príliš veľký. Maximálna veľkosť je 2MB.',
          position: 'top'
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        this.avatarUrl = e.target?.result as string;
        this.editedUser.avatarUrl = e.target?.result as string;
        console.log('Avatar changed (static - no backend upload)');
      };
      reader.readAsDataURL(file);
    },

    updateStatus(status: UserStatus): void {
      this.editedUser.status = status;
      this.$emit('update-profile', { status });
      
      let message = '';
      switch (status) {
        case 'online':
          message = 'Váš stav bol nastavený na Online';
          break;
        case 'dnd':
          message = 'Váš stav bol nastavený na Nerušiť - notifikácie sú vypnuté';
          break;
        case 'offline':
          message = 'Váš stav bol nastavený na Offline';
          break;
      }
      
      this.$q.notify({
        type: 'positive',
        message,
        position: 'top'
      });
    },

    saveProfile(): void {
      console.log('Profile save requested (static - no backend)');
      this.$emit('update-profile', {
        firstName: this.editedUser.firstName,
        lastName: this.editedUser.lastName,
        nickName: this.editedUser.nickName,
        email: this.editedUser.email,
        avatarUrl: this.editedUser.avatarUrl
      });
    },

    resetForm(): void {
      this.editedUser = {
        firstName: this.currentUser.firstName,
        lastName: this.currentUser.lastName,
        nickName: this.currentUser.nickName,
        email: this.currentUser.email,
        status: this.currentUser.status,
        avatarUrl: this.currentUser.avatarUrl
      };
      this.avatarUrl = this.currentUser.avatarUrl || '';
    },

    openFileInput(): void {
    const input = this.$refs.fileInput as HTMLInputElement;
    if (input) input.click();
  }
}
});
</script>