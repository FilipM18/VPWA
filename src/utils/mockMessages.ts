// Mock messages data for ChatFlow application
// AI generated data only for presentation purposes. Will be removed once real backend is implemented.

import type { ChatMessage } from '../types'

export const mockMessages: ChatMessage[] = [
  {
    id: 1,
    channelId: 1,
    authorId: 1,
    author: 'janko_novak',
    content: 'Ahoj všetci! Vitajte v našom novom ChatFlow kanáli 🎉',
    timestamp: new Date('2025-10-21T08:30:00.000Z'),
    reactions: [
      { emoji: '👋', userId: 2 },
      { emoji: '👋', userId: 3 },
      { emoji: '🎉', userId: 4 }
    ]
  },
  {
    id: 2,
    channelId: 1,
    authorId: 2,
    author: 'maria_kovacova',
    content: 'Super! Konečne môžeme komunikovať na jednom mieste 😊',
    timestamp: new Date('2025-10-21T08:32:15.000Z'),
    reactions: [
      { emoji: '❤️', userId: 1 },
      { emoji: '👍', userId: 3 }
    ]
  },
  {
    id: 3,
    channelId: 1,
    authorId: 3,
    author: 'peter_horvath',
    content: 'Môžem sa opýtať, kedy budeme mať stretnutie ohľadom projektu?',
    timestamp: new Date('2025-10-21T09:15:30.000Z')
  },
  {
    id: 4,
    channelId: 1,
    authorId: 1,
    author: 'janko_novak',
    content: '@peter_horvath Stretnutie plánujeme na piatok o 14:00. Všetkým príde pozvánka.',
    timestamp: new Date('2025-10-21T09:18:45.000Z'),
    mentionedUserIds: [3],
    reactions: [
      { emoji: '👍', userId: 3 },
      { emoji: '✅', userId: 2 }
    ]
  },
  {
    id: 5,
    channelId: 1,
    authorId: 4,
    author: 'lukas_varga',
    content: 'Mám otázku ohľadom dizajnu nového rozhrania. Potreboval by som váš feedback.',
    timestamp: new Date('2025-10-21T10:05:00.000Z')
  },
  {
    id: 6,
    channelId: 1,
    authorId: 2,
    author: 'maria_kovacova',
    content: 'Samozrejme! Môžeš zdieľať mockupy?',
    timestamp: new Date('2025-10-21T10:07:20.000Z')
  },
  {
    id: 7,
    channelId: 1,
    authorId: 4,
    author: 'lukas_varga',
    content: 'Áno, dám ich na Google Drive a pošlem link.',
    timestamp: new Date('2025-10-21T10:08:45.000Z'),
    reactions: [
      { emoji: '👍', userId: 2 },
      { emoji: '👍', userId: 1 }
    ]
  },
  {
    id: 8,
    channelId: 1,
    authorId: 5,
    author: 'eva_malinkova',
    content: 'Ahoj team! Práve som sa pripojila. Čo som zmeškala? 😅',
    timestamp: new Date('2025-10-21T11:30:00.000Z')
  },
  {
    id: 9,
    channelId: 1,
    authorId: 1,
    author: 'janko_novak',
    content: '@eva_malinkova Vitaj! Zatiaľ len základné privítanie a domluva stretnutia na piatok.',
    timestamp: new Date('2025-10-21T11:32:15.000Z'),
    mentionedUserIds: [5],
    reactions: [
      { emoji: '😊', userId: 5 }
    ]
  },
  {
    id: 10,
    channelId: 1,
    authorId: 3,
    author: 'peter_horvath',
    content: 'Mimochodom, máme už finalny zoznam požiadaviek od klienta?',
    timestamp: new Date('2025-10-21T12:45:00.000Z')
  },
  {
    id: 11,
    channelId: 1,
    authorId: 1,
    author: 'janko_novak',
    content: 'Áno, dostal som ho dnes ráno. Rozošlem ho všetkým emailom do konca dňa.',
    timestamp: new Date('2025-10-21T12:47:30.000Z'),
    reactions: [
      { emoji: '✅', userId: 3 },
      { emoji: '👍', userId: 2 },
      { emoji: '👍', userId: 4 }
    ]
  },
  {
    id: 12,
    channelId: 1,
    authorId: 2,
    author: 'maria_kovacova',
    content: 'Perfektné! Už sa teším na prácu na tomto projekte 🚀',
    timestamp: new Date('2025-10-21T13:00:00.000Z'),
    reactions: [
      { emoji: '🚀', userId: 1 },
      { emoji: '🚀', userId: 4 },
      { emoji: '💪', userId: 3 }
    ]
  },
  {
    id: 13,
    channelId: 1,
    authorId: 4,
    author: 'lukas_varga',
    content: 'BTW, kto sa stará o dokumentáciu? Potrebujeme ju aktualizovať.',
    timestamp: new Date('2025-10-21T14:15:00.000Z')
  },
  {
    id: 14,
    channelId: 1,
    authorId: 5,
    author: 'eva_malinkova',
    content: 'Ja sa môžem postarať o dokumentáciu. Môžem začať zajtra.',
    timestamp: new Date('2025-10-21T14:18:20.000Z'),
    reactions: [
      { emoji: '🙏', userId: 4 },
      { emoji: '❤️', userId: 1 }
    ]
  },
  {
    id: 15,
    channelId: 1,
    authorId: 1,
    author: 'janko_novak',
    content: '@eva_malinkova To je super! Ďakujem. Ak budeš potrebovať pomoc, daj vedieť.',
    timestamp: new Date('2025-10-21T14:20:00.000Z'),
    mentionedUserIds: [5]
  },
  {
    id: 16,
    channelId: 1,
    authorId: 3,
    author: 'peter_horvath',
    content: 'Má niekto skúsenosti s implementáciou WebSocket v Node.js? Potrebujem radu.',
    timestamp: new Date('2025-10-21T15:30:00.000Z')
  },
  {
    id: 17,
    channelId: 1,
    authorId: 4,
    author: 'lukas_varga',
    content: 'Áno! Používal som Socket.io v poslednom projekte. Môžem ti poslať nejaké príklady.',
    timestamp: new Date('2025-10-21T15:32:45.000Z'),
    reactions: [
      { emoji: '🙏', userId: 3 },
      { emoji: '👍', userId: 1 }
    ]
  },
  {
    id: 18,
    channelId: 1,
    authorId: 3,
    author: 'peter_horvath',
    content: 'To by bolo super! Vďaka!',
    timestamp: new Date('2025-10-21T15:33:30.000Z')
  },
  {
    id: 19,
    channelId: 1,
    authorId: 2,
    author: 'maria_kovacova',
    content: 'Máme už rozdelené úlohy na tento týždeň?',
    timestamp: new Date('2025-10-21T16:00:00.000Z')
  },
  {
    id: 20,
    channelId: 1,
    authorId: 1,
    author: 'janko_novak',
    content: 'Zhodíme to zajtra na daily standup. Zatiaľ sa môžete pozrieť na requirements.',
    timestamp: new Date('2025-10-21T16:02:15.000Z'),
    reactions: [
      { emoji: '👍', userId: 2 },
      { emoji: '👍', userId: 3 },
      { emoji: '✅', userId: 4 }
    ]
  },
  {
    id: 21,
    channelId: 1,
    authorId: 2,
    author: 'maria_kovacova',
    content: '@janko_novak Zhodíme to zajtra na daily standup. Zatiaľ sa môžete pozrieť na requirements.',
    timestamp: new Date('2025-10-21T17:02:15.000Z'),
    reactions: [
      { emoji: '👍', userId: 2 },
      { emoji: '👍', userId: 3 },
      { emoji: '✅', userId: 4 }
    ],
    mentionedUserIds: [1],
    mentionsMe: true
  }
]
