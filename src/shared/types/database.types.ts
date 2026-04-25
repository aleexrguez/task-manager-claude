export interface Database {
  public: {
    Tables: {
      tasks: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          status: string;
          priority: string;
          due_date: string | null;
          completed_at: string | null;
          is_archived: boolean;
          created_at: string;
          updated_at: string;
          recurrence_template_id: string | null;
          recurrence_date_key: string | null;
          position: number;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          status?: string;
          priority?: string;
          due_date?: string | null;
          completed_at?: string | null;
          is_archived?: boolean;
          created_at?: string;
          updated_at?: string;
          recurrence_template_id?: string | null;
          recurrence_date_key?: string | null;
          position?: number;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          status?: string;
          priority?: string;
          due_date?: string | null;
          completed_at?: string | null;
          is_archived?: boolean;
          created_at?: string;
          updated_at?: string;
          recurrence_template_id?: string | null;
          recurrence_date_key?: string | null;
          position?: number;
        };
        Relationships: [];
      };
      recurrence_templates: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          priority: string;
          frequency: string;
          weekly_days: number[] | null;
          monthly_day: number | null;
          lead_time_days: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          priority?: string;
          frequency: string;
          weekly_days?: number[] | null;
          monthly_day?: number | null;
          lead_time_days?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          priority?: string;
          frequency?: string;
          weekly_days?: number[] | null;
          monthly_day?: number | null;
          lead_time_days?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
