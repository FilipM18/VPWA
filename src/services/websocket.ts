import { io } from 'socket.io-client'
import type { Message } from '../types'

const API_BASE = (import.meta.env.VITE_API_BASE as string) || 'http://localhost:3333'

export interface UserJoinedEvent {
  userId: number
  nickName: string
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

  isSocketConnected(): boolean {
    return this.isConnected
  }

  getCurrentChannel(): number | null {
    return this.currentChannelId
  }
}

export default new WebSocketService()
