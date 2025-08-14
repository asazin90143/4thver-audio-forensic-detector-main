import { supabase, isSupabaseAvailable, type AudioAnalysisRecord, type AnalysisSession } from "./supabase"

export class DatabaseService {
  // Check if database is available
  private static checkAvailability(): boolean {
    if (!isSupabaseAvailable()) {
      console.warn("Database service not available - Supabase not initialized")
      return false
    }
    return true
  }

  // Save analysis results to database
  static async saveAnalysis(audioData: any): Promise<string | null> {
    if (!this.checkAvailability()) {
      throw new Error("Database service not available. Please check your Supabase configuration.")
    }

    try {
      const analysisRecord: AudioAnalysisRecord = {
        filename: audioData.name,
        duration: audioData.duration,
        sample_rate: audioData.analysisResults?.sampleRate || 44100,
        average_rms: audioData.analysisResults?.averageRMS || 0,
        detected_sounds: audioData.analysisResults?.detectedSounds || 0,
        dominant_frequency: audioData.analysisResults?.dominantFrequency || 0,
        max_decibels: audioData.analysisResults?.maxDecibels || 0,
        sound_events: audioData.analysisResults?.soundEvents || [],
        frequency_spectrum: audioData.analysisResults?.frequencySpectrum || [],
        analysis_results: audioData.analysisResults || {},
      }

      console.log("Attempting to save analysis to database...")

      const { data, error } = await supabase.from("audio_analyses").insert([analysisRecord]).select().single()

      if (error) {
        console.error("Supabase error saving analysis:", error)
        throw new Error(`Database error: ${error.message}`)
      }

      console.log("✅ Analysis saved successfully:", data.id)
      return data.id
    } catch (error) {
      console.error("Database save error:", error)
      throw error
    }
  }

  // Get all analyses
  static async getAllAnalyses(): Promise<AudioAnalysisRecord[]> {
    if (!this.checkAvailability()) {
      console.warn("Database not available, returning empty array")
      return []
    }

    try {
      const { data, error } = await supabase
        .from("audio_analyses")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching analyses:", error)
        return []
      }

      return data || []
    } catch (error) {
      console.error("Database fetch error:", error)
      return []
    }
  }

  // Delete analysis
  static async deleteAnalysis(id: string): Promise<boolean> {
    if (!this.checkAvailability()) {
      throw new Error("Database service not available")
    }

    try {
      const { error } = await supabase.from("audio_analyses").delete().eq("id", id)

      if (error) {
        console.error("Error deleting analysis:", error)
        return false
      }

      return true
    } catch (error) {
      console.error("Database delete error:", error)
      return false
    }
  }

  // Save analysis session
  static async saveSession(sessionName: string, audioData: any): Promise<string | null> {
    if (!this.checkAvailability()) {
      throw new Error("Database service not available")
    }

    try {
      const session: AnalysisSession = {
        session_name: sessionName,
        audio_file_url: audioData.url,
        analysis_data: {
          filename: audioData.name,
          duration: audioData.duration,
          sample_rate: audioData.analysisResults?.sampleRate || 44100,
          average_rms: audioData.analysisResults?.averageRMS || 0,
          detected_sounds: audioData.analysisResults?.detectedSounds || 0,
          dominant_frequency: audioData.analysisResults?.dominantFrequency || 0,
          max_decibels: audioData.analysisResults?.maxDecibels || 0,
          sound_events: audioData.analysisResults?.soundEvents || [],
          frequency_spectrum: audioData.analysisResults?.frequencySpectrum || [],
          analysis_results: audioData.analysisResults || {},
        },
      }

      const { data, error } = await supabase.from("analysis_sessions").insert([session]).select().single()

      if (error) {
        console.error("Error saving session:", error)
        return null
      }

      return data.id
    } catch (error) {
      console.error("Database session save error:", error)
      return null
    }
  }

  // Get all sessions
  static async getAllSessions(): Promise<AnalysisSession[]> {
    if (!this.checkAvailability()) {
      return []
    }

    try {
      const { data, error } = await supabase
        .from("analysis_sessions")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching sessions:", error)
        return []
      }

      return data || []
    } catch (error) {
      console.error("Database sessions fetch error:", error)
      return []
    }
  }

  // Test database connection
  static async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.checkAvailability()) {
      return {
        success: false,
        message: "Supabase client not initialized",
      }
    }

    try {
      // Try to fetch from a table (this will test the connection)
      const { data, error } = await supabase.from("audio_analyses").select("count").limit(1)

      if (error) {
        return {
          success: false,
          message: `Database connection failed: ${error.message}`,
        }
      }

      return {
        success: true,
        message: "Database connection successful",
      }
    } catch (error) {
      return {
        success: false,
        message: `Connection test failed: ${error}`,
      }
    }
  }
}
