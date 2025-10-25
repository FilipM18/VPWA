// User Types
export interface User {
  id: number
  firstName: string
  lastName: string
  nickName: string
  email: string
  status: UserStatus
  createdAt?: Date
  updatedAt?: Date
  avatarUrl?: string
}

export type UserStatus = 'online' | 'dnd' | 'offline'

export interface UserSettings {
  mentionOnlyNotifications: boolean
  theme?: 'light' | 'dark'
}

// Channel Types
export interface Channel {
  id: number
  name: string
  isPrivate: boolean
  adminId: number
  createdAt: Date | string
  lastActivityAt: Date | string
  unreadCount?: number
  isNewInvite?: boolean
  invitedAt?: string
}

export interface ChannelMember {
  channelId: number
  userId: number
  joinedAt: Date | string
  kickVotes?: number
  isBanned?: boolean
}

// Message Types
export interface Message {
  id: number
  channelId: number
  authorId: number
  author: string
  content: string
  timestamp: Date
  mentionedUserIds?: number[]
  mentionsMe?: boolean
  editedAt?: Date
  isSystem?: boolean
  systemType?: 'user_joined' | 'user_left' | 'user_invited' | 'kick_vote_started' | 'kick_vote_ended' | 'user_kicked'
}

export interface MessageReaction {
  emoji: string
  userId: number
}

export type ChatMessage = Message & {
  reactions?: MessageReaction[]
  mentions?: string[]
}

// Command Types
export interface Command {
  type: CommandType
  args: string[]
  rawCommand: string
}

export type CommandType =
  | 'join'
  | 'invite'
  | 'revoke'
  | 'cancel'
  | 'quit'
  | 'list'
  | 'unknown'

export interface CommandResult {
  success: boolean
  message: string
  data?: unknown
}

export interface TypingIndicator {
  channelId: number
  userId: number
  nickName: string
  isTyping: boolean
  messagePreview?: string
}

export interface Notification {
  id: number
  userId: number
  channelId: number
  messageId: number
  type: NotificationType
  content: string
  read: boolean
  createdAt: Date
}

export type NotificationType = 'message' | 'mention' | 'invite' | 'kick'

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  firstName: string
  lastName: string
  nickName: string
  email: string
  password: string
}

export interface AuthResponse {
  user: User
  token: string
}

export interface NotificationPreferences {
  mentionsOnly: boolean
  enableDndMode: boolean
  newMessages?: boolean
  directMessages?: boolean
  channelInvites?: boolean
  soundEnabled?: boolean
  soundVolume?: number
}
