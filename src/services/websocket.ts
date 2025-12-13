import { io } from 'socket.io-client'
import type { Message } from '../types'

const API_BASE = (import.meta.env.VITE_API_BASE as string) || 'http://localhost:3333'

export interface UserJoinedEvent {
  userId: number
  nickName: string
}

export interface TypingEvent {
  userId: number
  nickName: string
  channelId: number
  messagePreview?: string
}

export interface StoppedTypingEvent {
  userId: number
  channelId: number
}

export interface UserKickedEvent {
  channelId: number
  channelName?: string  // Present when this event is for ME (I was kicked)
  reason: string
  userId?: number  // Present when SOMEONE ELSE was kicked (for member list update)
  nickName?: string  // Present when SOMEONE ELSE was kicked
  kickedBy?: string  // Who kicked the user
}

export interface ChannelInvitedEvent {
  channelId: number
  channelName: string
  invitedBy: string
  isPrivate?: boolean
}

export interface ChannelDeletedEvent {
  channelId: number
  channelName: string
  deletedBy?: string
}

class WebSocketService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private socket: any = null
  private isConnected = false
  private currentChannelId: number | null = null

  // Event listeners
  private messageListeners: Set<(message: Message) => void> = new Set()
  private userJoinedListeners: Set<(event: UserJoinedEvent) => void> = new Set()
  private userLeftListeners: Set<(event: UserJoinedEvent) => void> = new Set()
  private typingListeners: Set<(event: TypingEvent) => void> = new Set()
  private stoppedTypingListeners: Set<(event: StoppedTypingEvent) => void> = new Set()
  private userKickedListeners: Set<(event: UserKickedEvent) => void> = new Set()
  private channelInvitedListeners: Set<(event: ChannelInvitedEvent) => void> = new Set()
  private channelDeletedListeners: Set<(event: ChannelDeletedEvent) => void> = new Set()

  // Public getter for connection status
  get connected(): boolean {
    return this.isConnected
  }

  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isConnected) {
        resolve()
        return
      }

      this.socket = io(API_BASE, {
        transports: ['websocket', 'polling'],
      })

      this.socket.on('connect', () => {
        console.log('WebSocket connected')
        this.isConnected = true

        // Authenticate with opaque token (oat_...)
        console.log('Sending auth token:', token.substring(0, 20) + '...')
        this.socket!.emit('authenticate', token)
      })

      this.socket.on('authenticated', (data: { userId: number; nickName: string }) => {
        console.log('WebSocket authenticated:', data)
        resolve()
      })

      this.socket.on('auth_error', (error: string) => {
        console.error('WebSocket auth error:', error)
        reject(new Error(error))
      })

      this.socket.on('disconnect', () => {
        console.log('WebSocket disconnected')
        this.isConnected = false
        this.currentChannelId = null
      })

      this.socket.on('error', (error: string) => {
        console.error('WebSocket error:', error)
      })

      // Message events
      this.socket.on('new_message', (message: Message) => {
        console.log('Received new_message event:', message)
        this.messageListeners.forEach((listener) => listener(message))
      })

      // User joined/left events
      this.socket.on('user_joined', (event: UserJoinedEvent) => {
        this.userJoinedListeners.forEach((listener) => listener(event))
      })

      this.socket.on('user_left', (event: UserJoinedEvent) => {
        this.userLeftListeners.forEach((listener) => listener(event))
      })

      // Typing events
      this.socket.on('user_typing', (event: TypingEvent) => {
        console.log('Received user_typing event:', event)
        this.typingListeners.forEach((listener) => listener(event))
      })

      this.socket.on('user_stopped_typing', (event: StoppedTypingEvent) => {
        console.log('Received user_stopped_typing event:', event)
        this.stoppedTypingListeners.forEach((listener) => listener(event))
      })

      // Kick/ban and invite events
      this.socket.on('user_kicked', (event: UserKickedEvent) => {
        console.log('Received user_kicked event:', event)
        this.userKickedListeners.forEach((listener) => listener(event))
      })

      this.socket.on('channel_invited', (event: ChannelInvitedEvent) => {
        console.log('Received channel_invited event:', event)
        this.channelInvitedListeners.forEach((listener) => listener(event))
      })

      this.socket.on('channel_deleted', (event: ChannelDeletedEvent) => {
        console.log('Received channel_deleted event:', event)
        this.channelDeletedListeners.forEach((listener) => listener(event))
      })

      // Connection timeout
      setTimeout(() => {
        if (!this.isConnected) {
          reject(new Error('Connection timeout'))
        }
      }, 10000)
    })
  }

  disconnect(): void {
    if (this.socket) {
      if (this.currentChannelId) {
        this.leaveChannel(this.currentChannelId)
      }
      this.socket.disconnect()
      this.socket = undefined
      this.isConnected = false
      this.currentChannelId = null
    }
  }

  joinChannel(channelId: number): void {
    if (!this.socket || !this.isConnected) {
      console.error('Cannot join channel: not connected')
      return
    }

    // Leave current channel first
    if (this.currentChannelId && this.currentChannelId !== channelId) {
      this.leaveChannel(this.currentChannelId)
    }

    this.socket.emit('join_channel', channelId)
    this.currentChannelId = channelId
    console.log(`Joined channel ${channelId}`)
  }

  leaveChannel(channelId: number): void {
    if (!this.socket || !this.isConnected) return

    this.socket.emit('leave_channel', channelId)
    if (this.currentChannelId === channelId) {
      this.currentChannelId = null
    }
    console.log(`Left channel ${channelId}`)
  }

  sendMessage(channelId: number, content: string, mentionedUserIds?: number[]): void {
    if (!this.socket || !this.isConnected) {
      console.error('Cannot send message: not connected')
      return
    }

    this.socket.emit('send_message', {
      channelId,
      content,
      mentionedUserIds: mentionedUserIds || [],
    })
  }

  sendTyping(channelId: number, messagePreview?: string): void {
    if (!this.socket || !this.isConnected) {
      console.log('Cannot send typing: not connected')
      return
    }

    console.log('Sending typing event:', { channelId, messagePreview })
    this.socket.emit('user_typing', {
      channelId,
      messagePreview,
    })
  }

  stopTyping(channelId: number): void {
    if (!this.socket || !this.isConnected) {
      return
    }

    console.log('Sending stopped typing event:', { channelId })
    this.socket.emit('user_stopped_typing', {
      channelId,
    })
  }

  // Event listener registration
  onMessage(callback: (message: Message) => void): () => void {
    this.messageListeners.add(callback)
    return () => this.messageListeners.delete(callback)
  }

  onUserJoined(callback: (event: UserJoinedEvent) => void): () => void {
    this.userJoinedListeners.add(callback)
    return () => this.userJoinedListeners.delete(callback)
  }

  onUserLeft(callback: (event: UserJoinedEvent) => void): () => void {
    this.userLeftListeners.add(callback)
    return () => this.userLeftListeners.delete(callback)
  }

  onTyping(callback: (event: TypingEvent) => void): () => void {
    this.typingListeners.add(callback)
    return () => this.typingListeners.delete(callback)
  }

  onStoppedTyping(callback: (event: StoppedTypingEvent) => void): () => void {
    this.stoppedTypingListeners.add(callback)
    return () => this.stoppedTypingListeners.delete(callback)
  }

  onUserKicked(callback: (event: UserKickedEvent) => void): () => void {
    this.userKickedListeners.add(callback)
    return () => this.userKickedListeners.delete(callback)
  }

  onChannelInvited(callback: (event: ChannelInvitedEvent) => void): () => void {
    this.channelInvitedListeners.add(callback)
    return () => this.channelInvitedListeners.delete(callback)
  }

  onChannelDeleted(callback: (event: ChannelDeletedEvent) => void): () => void {
    this.channelDeletedListeners.add(callback)
    return () => this.channelDeletedListeners.delete(callback)
  }

  isSocketConnected(): boolean {
    return this.isConnected
  }

  getCurrentChannel(): number | null {
    return this.currentChannelId
  }
}

export default new WebSocketService()
