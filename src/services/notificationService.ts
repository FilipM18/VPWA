// Service pre správu browser notifikácií
import type { NotificationPreferences, Message, User } from '../types'

export interface NotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  data?: {
    channelId: number
    messageId: number
  }
}

class NotificationService {
  private permission: NotificationPermission = 'default'

  constructor() {
    if ('Notification' in window) {
      this.permission = Notification.permission
    }
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('Browser nepodporuje notifikácie')
      return 'denied'
    }

    if (this.permission === 'granted') {
      return 'granted'
    }

    try {
      this.permission = await Notification.requestPermission()
      return this.permission
    } catch (error) {
      console.error('Chyba pri žiadosti o povolenie notifikácií:', error)
      return 'denied'
    }
  }

  isPermissionGranted(): boolean {
    return this.permission === 'granted'
  }

  getPermission(): NotificationPermission {
    return this.permission
  }

  showNotification(payload: NotificationPayload): Notification | null {
    if (!this.isPermissionGranted()) {
      console.warn('Notifikácie nie sú povolené! Current permission:', this.permission)
      console.log('Tip: Prejdi do Nastavenia -> Notifikácie a klikni na "Povoliť"')
      return null
    }

    try {
      const notificationOptions = {
        body: payload.body,
        icon: payload.icon || '/icons/favicon-128x128.png',
        badge: payload.badge || '/icons/favicon-96x96.png',
        tag: payload.tag || `msg-${payload.data?.messageId}`,
        data: payload.data,
        requireInteraction: true, // notifikácia zostane až kým ju neklikneš
        silent: false, // Povolí zvuk keby chceme :D
      }

      const notification = new Notification(payload.title, notificationOptions)

      notification.onerror = (error) => {
        console.error('Notification ERROR:', error)
      }

      // Kliknutie na notifikáciu - fokus na aplikáciu
      notification.onclick = () => {
        window.focus()
        notification.close()

        // Naviguj na správny kanál
        if (payload.data?.channelId) {
          // Emitni event pre navigation (bude ho počúvať MainLayout)
          window.dispatchEvent(
            new CustomEvent('notification-clicked', {
              detail: { channelId: payload.data.channelId }
            })
          )
        }
      }

      console.log('Notification shown:', payload.title)
      return notification
    } catch (error) {
      console.error('Chyba pri zobrazení notifikácie:', error)
      return null
    }
  }

  /**
   * Hlavná logika - rozhoduje či ukázať notifikáciu
  */
  shouldNotify(
    message: Message,
    currentUser: User,
    preferences: NotificationPreferences,
    isAppVisible: boolean,
    currentChannelId: number | null
  ): boolean {
    // 1. Aplikácia je viditeľná A user je v tomto kanáli - netreba notifikáciu
    if (isAppVisible && currentChannelId === message.channelId) {
      console.log('REASON: App is visible and user is in this channel')
      return false
    }

    // 2. Používateľ má DND status - žiadne notifikácie
    if (currentUser.status === 'dnd' || preferences.enableDndMode) {
      console.log('REASON: DND mode enabled', {
        userStatus: currentUser.status,
        dndPreference: preferences.enableDndMode
      })
      return false
    }

    // 3. Používateľ je offline - žiadne notifikácie
    if (currentUser.status === 'offline') {
      console.log('REASON: User status is offline')
      return false
    }

    // 4. Správa je od mňa - netreba notifikovať sám seba
    if (message.authorId === currentUser.id) {
      console.log('REASON: Message is from myself', {
        messageAuthorId: message.authorId,
        currentUserId: currentUser.id
      })
      return false
    }

    // 5. Kontrola nastavení - mentions only
    if (preferences.mentionsOnly) {
      const hasMention = message.mentionsMe || false
      if (!hasMention) {
        console.log('ℹ️ Mentions only: správa neobsahuje @mention')
      }
      return hasMention
    }

    // 6. Všetky podmienky splnené - notifikuj
    console.log('DECISION: SHOW notification (all checks passed)')
    return true
  }

  createMessageNotification(
    message: Message,
    channelName: string
  ): NotificationPayload {
    const truncatedContent = message.content.length > 100
      ? message.content.substring(0, 100) + '...'
      : message.content

    return {
      title: `${message.author} v #${channelName}`,
      body: truncatedContent,
      icon: '/icons/favicon-128x128.png',
      badge: '/icons/favicon-96x96.png',
      tag: `channel-${message.channelId}`, // Rovnaký tag = prepíše predošlú notifikáciu z kanálu
      data: {
        channelId: message.channelId,
        messageId: message.id,
      },
    }
  }

  getPreferences(): NotificationPreferences {
    const stored = localStorage.getItem('notification_preferences')
    if (stored) {
      try {
        return JSON.parse(stored) as NotificationPreferences
      } catch {
        return this.getDefaultPreferences()
      }
    }
    return this.getDefaultPreferences()
  }

  savePreferences(preferences: NotificationPreferences): void {
    localStorage.setItem('notification_preferences', JSON.stringify(preferences))
  }

  private getDefaultPreferences(): NotificationPreferences {
    return {
      mentionsOnly: false,
      enableDndMode: false,
      newMessages: true,
      directMessages: true,
      channelInvites: true,
      soundEnabled: true,
      soundVolume: 50,
    }
  }
}

export default new NotificationService()
