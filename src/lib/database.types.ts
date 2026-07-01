// ============================================================
// Generated from the live Supabase schema (project qgxpmkyqemmifrqgxswr).
// Regenerate after schema changes:
//   supabase gen types typescript --project-id qgxpmkyqemmifrqgxswr > src/lib/database.types.ts
// Passed as the `Database` generic to createClient in src/lib/supabase.ts so that
// table/column names and row shapes are checked against the real schema.
// ============================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          created_at: string
          email: string | null
          emoji: string | null
          full_name: string | null
          id: string
          is_admin: boolean
          role: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          emoji?: string | null
          full_name?: string | null
          id: string
          is_admin?: boolean
          role?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          emoji?: string | null
          full_name?: string | null
          id?: string
          is_admin?: boolean
          role?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          brief: string | null
          color: string
          created_at: string
          created_by: string | null
          description_md: string | null
          emoji: string
          id: string
          is_archived: boolean
          name: string
          sort_order: number
          team_id: string | null
          updated_at: string
        }
        Insert: {
          brief?: string | null
          color?: string
          created_at?: string
          created_by?: string | null
          description_md?: string | null
          emoji?: string
          id?: string
          is_archived?: boolean
          name: string
          sort_order?: number
          team_id?: string | null
          updated_at?: string
        }
        Update: {
          brief?: string | null
          color?: string
          created_at?: string
          created_by?: string | null
          description_md?: string | null
          emoji?: string
          id?: string
          is_archived?: boolean
          name?: string
          sort_order?: number
          team_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      task_assignees: {
        Row: {
          assigned_at: string
          profile_id: string
          task_id: string
        }
        Insert: {
          assigned_at?: string
          profile_id: string
          task_id: string
        }
        Update: {
          assigned_at?: string
          profile_id?: string
          task_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          body_md: string | null
          created_at: string
          created_by: string | null
          due_date: string | null
          id: string
          priority: string | null
          project_id: string
          sort_order: number
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          body_md?: string | null
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          project_id: string
          sort_order?: number
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          body_md?: string | null
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          project_id?: string
          sort_order?: number
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          created_at: string
          profile_id: string
          team_id: string
        }
        Insert: {
          created_at?: string
          profile_id: string
          team_id: string
        }
        Update: {
          created_at?: string
          profile_id?: string
          team_id?: string
        }
        Relationships: []
      }
      teams: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
        }
        Relationships: []
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
