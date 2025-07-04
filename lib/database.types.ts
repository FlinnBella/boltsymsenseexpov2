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
      patients: {
        Row: {
          allergies: string | null
          appointment_reminder_preferences: Json | null
          assigned_primary_care_provider_id: string | null
          blood_type: string | null
          chronic_conditions: string | null
          communication_preferences: Json | null
          created_at: string | null
          current_medications: string | null
          emergency_contact_email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relationship: string | null
          ethnicity: string | null
          family_medical_history: string | null
          height_inches: number | null
          id: string
          insurance_group_number: string | null
          insurance_policy_number: string | null
          insurance_provider: string | null
          insurance_subscriber_id: string | null
          marital_status: string | null
          medical_record_number: string | null
          occupation: string | null
          preferred_language: string | null
          preferred_provider_gender: string | null
          race: string | null
          registration_source: string | null
          updated_at: string | null
          user_id: string
          weight_pounds: number | null
        }
        Insert: {
          allergies?: string | null
          appointment_reminder_preferences?: Json | null
          assigned_primary_care_provider_id?: string | null
          blood_type?: string | null
          chronic_conditions?: string | null
          communication_preferences?: Json | null
          created_at?: string | null
          current_medications?: string | null
          emergency_contact_email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          ethnicity?: string | null
          family_medical_history?: string | null
          height_inches?: number | null
          id?: string
          insurance_group_number?: string | null
          insurance_policy_number?: string | null
          insurance_provider?: string | null
          insurance_subscriber_id?: string | null
          marital_status?: string | null
          medical_record_number?: string | null
          occupation?: string | null
          preferred_language?: string | null
          preferred_provider_gender?: string | null
          race?: string | null
          registration_source?: string | null
          updated_at?: string | null
          user_id: string
          weight_pounds?: number | null
        }
        Update: {
          allergies?: string | null
          appointment_reminder_preferences?: Json | null
          assigned_primary_care_provider_id?: string | null
          blood_type?: string | null
          chronic_conditions?: string | null
          communication_preferences?: Json | null
          created_at?: string | null
          current_medications?: string | null
          emergency_contact_email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          ethnicity?: string | null
          family_medical_history?: string | null
          height_inches?: number | null
          id?: string
          insurance_group_number?: string | null
          insurance_policy_number?: string | null
          insurance_provider?: string | null
          insurance_subscriber_id?: string | null
          marital_status?: string | null
          medical_record_number?: string | null
          occupation?: string | null
          preferred_language?: string | null
          preferred_provider_gender?: string | null
          race?: string | null
          registration_source?: string | null
          updated_at?: string | null
          user_id?: string
          weight_pounds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "patients_assigned_primary_care_provider_id_fkey"
            columns: ["assigned_primary_care_provider_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patients_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      providers: {
        Row: {
          accepted_insurance_plans: string[] | null
          accepts_new_patients: boolean | null
          average_rating: number | null
          board_certifications: string[] | null
          clinic_address_line_1: string | null
          clinic_address_line_2: string | null
          clinic_city: string | null
          clinic_country: string | null
          clinic_email: string | null
          clinic_fax: string | null
          clinic_name: string | null
          clinic_phone: string | null
          clinic_state: string | null
          clinic_zip_code: string
          created_at: string | null
          dea_number: string | null
          fellowship_program: string | null
          hospital_affiliations: string[] | null
          id: string
          is_accepting_patients: boolean | null
          languages_spoken: string[] | null
          license_expiration_date: string | null
          license_number: string
          medical_degree: string
          medical_school: string | null
          npi_number: string | null
          onboarding_completed: boolean | null
          practice_name: string | null
          primary_specialty: string
          provider_status: string | null
          residency_program: string | null
          secondary_specialties: string[] | null
          standard_appointment_duration: number | null
          subspecialties: string[] | null
          telemedicine_available: boolean | null
          timezone: string | null
          total_reviews: number | null
          updated_at: string | null
          user_id: string
          verification_status: string | null
          verified_at: string | null
          verified_by: string | null
          working_hours: Json | null
          years_of_experience: number | null
        }
        Insert: {
          accepted_insurance_plans?: string[] | null
          accepts_new_patients?: boolean | null
          average_rating?: number | null
          board_certifications?: string[] | null
          clinic_address_line_1?: string | null
          clinic_address_line_2?: string | null
          clinic_city?: string | null
          clinic_country?: string | null
          clinic_email?: string | null
          clinic_fax?: string | null
          clinic_name?: string | null
          clinic_phone?: string | null
          clinic_state?: string | null
          clinic_zip_code: string
          created_at?: string | null
          dea_number?: string | null
          fellowship_program?: string | null
          hospital_affiliations?: string[] | null
          id?: string
          is_accepting_patients?: boolean | null
          languages_spoken?: string[] | null
          license_expiration_date?: string | null
          license_number: string
          medical_degree: string
          medical_school?: string | null
          npi_number?: string | null
          onboarding_completed?: boolean | null
          practice_name?: string | null
          primary_specialty: string
          provider_status?: string | null
          residency_program?: string | null
          secondary_specialties?: string[] | null
          standard_appointment_duration?: number | null
          subspecialties?: string[] | null
          telemedicine_available?: boolean | null
          timezone?: string | null
          total_reviews?: number | null
          updated_at?: string | null
          user_id: string
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
          working_hours?: Json | null
          years_of_experience?: number | null
        }
        Update: {
          accepted_insurance_plans?: string[] | null
          accepts_new_patients?: boolean | null
          average_rating?: number | null
          board_certifications?: string[] | null
          clinic_address_line_1?: string | null
          clinic_address_line_2?: string | null
          clinic_city?: string | null
          clinic_country?: string | null
          clinic_email?: string | null
          clinic_fax?: string | null
          clinic_name?: string | null
          clinic_phone?: string | null
          clinic_state?: string | null
          clinic_zip_code?: string
          created_at?: string | null
          dea_number?: string | null
          fellowship_program?: string | null
          hospital_affiliations?: string[] | null
          id?: string
          is_accepting_patients?: boolean | null
          languages_spoken?: string[] | null
          license_expiration_date?: string | null
          license_number?: string
          medical_degree?: string
          medical_school?: string | null
          npi_number?: string | null
          onboarding_completed?: boolean | null
          practice_name?: string | null
          primary_specialty?: string
          provider_status?: string | null
          residency_program?: string | null
          secondary_specialties?: string[] | null
          standard_appointment_duration?: number | null
          subspecialties?: string[] | null
          telemedicine_available?: boolean | null
          timezone?: string | null
          total_reviews?: number | null
          updated_at?: string | null
          user_id?: string
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
          working_hours?: Json | null
          years_of_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "providers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "providers_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          address_line_1: string | null
          address_line_2: string | null
          city: string | null
          country: string | null
          created_at: string | null
          date_of_birth: string | null
          email: string
          first_name: string
          gender: string | null
          id: string
          is_active: boolean | null
          is_verified: boolean | null
          last_login: string | null
          last_name: string
          middle_name: string | null
          password_hash: string
          phone: string | null
          profile_image_url: string | null
          state: string | null
          updated_at: string | null
          user_type: string
          zip_code: string | null
        }
        Insert: {
          address_line_1?: string | null
          address_line_2?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email: string
          first_name: string
          gender?: string | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          last_login?: string | null
          last_name: string
          middle_name?: string | null
          password_hash: string
          phone?: string | null
          profile_image_url?: string | null
          state?: string | null
          updated_at?: string | null
          user_type: string
          zip_code?: string | null
        }
        Update: {
          address_line_1?: string | null
          address_line_2?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string
          first_name?: string
          gender?: string | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          last_login?: string | null
          last_name?: string
          middle_name?: string | null
          password_hash?: string
          phone?: string | null
          profile_image_url?: string | null
          state?: string | null
          updated_at?: string | null
          user_type?: string
          zip_code?: string | null
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
