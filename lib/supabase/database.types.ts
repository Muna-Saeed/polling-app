export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      polls: {
        Row: {
          id: string
          question: string
          created_at: string
          user_id: string
        }
        Insert: {
          id?: string
          question: string
          created_at?: string
          user_id: string
        }
        Update: {
          id?: string
          question?: string
          created_at?: string
          user_id?: string
        }
      }
      poll_options: {
        Row: {
          id: string
          poll_id: string
          text: string
        }
        Insert: {
          id?: string
          poll_id: string
          text: string
        }
        Update: {
          id?: string
          poll_id?: string
          text?: string
        }
      }
      votes: {
        Row: {
          id: string
          poll_id: string
          option_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          poll_id: string
          option_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          poll_id?: string
          option_id?: string
          user_id?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
