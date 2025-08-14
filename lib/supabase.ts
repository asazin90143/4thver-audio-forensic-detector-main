import { createClient } from "@/utils/supabase/client"

// Use the proper client-side Supabase client
export const supabase = createClient()

// Database types
export interface AudioAnalysisRecord {
  id?: string
  filename: string
  duration: number
  sample_rate: number
  average_rms: number
  detected_sounds: number
  dominant_frequency: number
  max_decibels: number
  sound_events: any[]
  frequency_spectrum: any[]
  analysis_results: any
  created_at?: string
  user_id?: string
}

export interface AnalysisSession {
  id?: string
  session_name: string
  audio_file_url: string
  analysis_data: AudioAnalysisRecord
  created_at?: string
  user_id?: string
}

// Helper function to check if Supabase is available
export const isSupabaseAvailable = (): boolean => {
  try {
    return !!supabase && !!process.env.NEXT_PUBLIC_SUPABASE_URL
  } catch {
    return false
  }
}

// Helper function to get connection status
export const getSupabaseStatus = (): { connected: boolean; url?: string; error?: string } => {
  try {
    if (!supabase || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return {
        connected: false,
        error: "Supabase client not initialized",
      }
    }

    return {
      connected: true,
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    }
  } catch (error) {
    return {
      connected: false,
      error: "Configuration error",
    }
  }
}
