import Dexie, { type Table } from 'dexie'

export interface CachedBook {
  id: string // This will map to the Supabase book ID
  epubData: ArrayBuffer | Blob
  cachedAt: number
  title?: string
  author?: string
  fileType?: string // e.g. 'epub', 'pdf', 'txt'
}

export class EbookDatabase extends Dexie {
  books!: Table<CachedBook, string>

  constructor() {
    super('EbookReaderDB')
    this.version(1).stores({
      books: 'id', // Primary key is 'id'
    })
  }
}

export const db = new EbookDatabase()
