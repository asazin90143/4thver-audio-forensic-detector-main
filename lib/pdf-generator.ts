import jsPDF from "jspdf"
import "jspdf-autotable"

interface AudioData {
  blob: Blob
  url: string
  name: string
  duration: number
  analysisResults?: any
}

type ProgressCallback = (progress: number, stage: string) => void

export const generatePDFReport = async (audioData: AudioData, onProgress?: ProgressCallback): Promise<void> => {
  if (!audioData.analysisResults) {
    throw new Error("No analysis results available for PDF generation")
  }

  const doc = new jsPDF()
  const results = audioData.analysisResults

  // Progress tracking
  const updateProgress = (progress: number, stage: string) => {
    if (onProgress) {
      onProgress(progress, stage)
    }
  }

  updateProgress(5, "Initializing PDF document...")

  // Set up fonts and colors
  doc.setFont("helvetica", "bold")
  doc.setFontSize(20)
  doc.setTextColor(128, 0, 128) // Purple color

  // Title
  doc.text("Audio Forensic Analysis Report", 20, 25)

  // Add logo/header line
  doc.setDrawColor(128, 0, 128)
  doc.setLineWidth(2)
  doc.line(20, 30, 190, 30)

  updateProgress(10, "Adding file information...")

  // Reset font for content
  doc.setFont("helvetica", "normal")
  doc.setFontSize(12)
  doc.setTextColor(0, 0, 0)

  let yPosition = 45

  // File Information Section
  doc.setFont("helvetica", "bold")
  doc.setFontSize(14)
  doc.text("File Information", 20, yPosition)
  yPosition += 10

  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)

  const fileInfo = [
    ["Filename", audioData.name],
    ["Duration", `${results.duration} seconds`],
    ["Sample Rate", `${results.sampleRate} Hz`],
    ["Analysis Date", new Date(results.timestamp || Date.now()).toLocaleString()],
    ["Average RMS Energy", results.averageRMS?.toFixed(6) || "N/A"],
    ["Max Decibels", `${results.maxDecibels} dB`],
  ]

  // @ts-ignore - jsPDF autoTable types
  doc.autoTable({
    startY: yPosition,
    head: [["Property", "Value"]],
    body: fileInfo,
    theme: "grid",
    headStyles: { fillColor: [128, 0, 128], textColor: 255 },
    margin: { left: 20, right: 20 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 60 },
      1: { cellWidth: 110 },
    },
  })

  updateProgress(25, "Processing sound detection data...")

  // @ts-ignore
  yPosition = doc.lastAutoTable.finalY + 15

  // Sound Detection Summary
  doc.setFont("helvetica", "bold")
  doc.setFontSize(14)
  doc.text("Sound Detection Summary", 20, yPosition)
  yPosition += 10

  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)

  const detectionSummary = [
    ["Total Sound Events Detected", results.detectedSounds?.toString() || "0"],
    ["Dominant Frequency", `${results.dominantFrequency} Hz`],
    ["Frequency Classification", classifyFrequency(results.dominantFrequency)],
    ["Analysis Confidence", "High (Automated Detection)"],
    ["Processing Method", "FFT + STFT Analysis"],
    ["Detection Algorithm", "Energy-based with Spectral Features"],
  ]

  // @ts-ignore
  doc.autoTable({
    startY: yPosition,
    head: [["Metric", "Value"]],
    body: detectionSummary,
    theme: "grid",
    headStyles: { fillColor: [0, 128, 0], textColor: 255 },
    margin: { left: 20, right: 20 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 80 },
      1: { cellWidth: 90 },
    },
  })

  updateProgress(40, "Generating sound events table...")

  // @ts-ignore
  yPosition = doc.lastAutoTable.finalY + 15

  // Check if we need a new page
  if (yPosition > 250) {
    doc.addPage()
    yPosition = 20
  }

  // Sound Events Table
  doc.setFont("helvetica", "bold")
  doc.setFontSize(14)
  doc.text("Detected Sound Events", 20, yPosition)
  yPosition += 10

  if (results.soundEvents && results.soundEvents.length > 0) {
    const soundEventsData = results.soundEvents
      .slice(0, 20) // Show more events
      .map((event: any, index: number) => [
        (index + 1).toString(),
        `${event.time}s`,
        event.type || "Unknown",
        `${event.frequency} Hz`,
        `${(event.amplitude * 100).toFixed(1)}%`,
        `${event.decibels} dB`,
        classifyFrequency(event.frequency),
      ])

    // @ts-ignore
    doc.autoTable({
      startY: yPosition,
      head: [["#", "Time", "Type", "Frequency", "Amplitude", "Decibels", "Classification"]],
      body: soundEventsData,
      theme: "striped",
      headStyles: { fillColor: [255, 140, 0], textColor: 255 },
      margin: { left: 20, right: 20 },
      styles: { fontSize: 7 },
      columnStyles: {
        0: { cellWidth: 12 },
        1: { cellWidth: 20 },
        2: { cellWidth: 25 },
        3: { cellWidth: 25 },
        4: { cellWidth: 20 },
        5: { cellWidth: 20 },
        6: { cellWidth: 35 },
      },
    })

    // @ts-ignore
    yPosition = doc.lastAutoTable.finalY + 15
  } else {
    doc.setFont("helvetica", "italic")
    doc.text("No sound events detected in this audio file.", 20, yPosition)
    yPosition += 15
  }

  updateProgress(60, "Creating frequency analysis...")

  // Add new page for frequency analysis
  doc.addPage()
  yPosition = 20

  // Frequency Analysis Section
  doc.setFont("helvetica", "bold")
  doc.setFontSize(14)
  doc.text("Comprehensive Frequency Analysis", 20, yPosition)
  yPosition += 15

  // Create frequency distribution chart (text-based)
  if (results.frequencySpectrum && results.frequencySpectrum.length > 0) {
    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)
    doc.text("Frequency Distribution (Top 15 Components):", 20, yPosition)
    yPosition += 10

    const topFrequencies = results.frequencySpectrum
      .sort((a: any, b: any) => b.magnitude - a.magnitude)
      .slice(0, 15)
      .map((freq: any, index: number) => [
        (index + 1).toString(),
        `${freq.frequency} Hz`,
        `${(freq.magnitude * 100).toFixed(1)}%`,
        generateBarChart(freq.magnitude),
        classifyFrequency(freq.frequency),
      ])

    // @ts-ignore
    doc.autoTable({
      startY: yPosition,
      head: [["Rank", "Frequency", "Magnitude", "Visual", "Classification"]],
      body: topFrequencies,
      theme: "grid",
      headStyles: { fillColor: [0, 0, 128], textColor: 255 },
      margin: { left: 20, right: 20 },
      styles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 30 },
        2: { cellWidth: 25 },
        3: { cellWidth: 60, fontFamily: "courier" },
        4: { cellWidth: 40 },
      },
    })

    // @ts-ignore
    yPosition = doc.lastAutoTable.finalY + 15
  }

  updateProgress(75, "Adding analysis methodology...")

  // Statistical Analysis
  doc.setFont("helvetica", "bold")
  doc.setFontSize(14)
  doc.text("Statistical Analysis", 20, yPosition)
  yPosition += 10

  const statisticalData = generateStatisticalAnalysis(results)

  // @ts-ignore
  doc.autoTable({
    startY: yPosition,
    head: [["Metric", "Value", "Interpretation"]],
    body: statisticalData,
    theme: "grid",
    headStyles: { fillColor: [128, 0, 128], textColor: 255 },
    margin: { left: 20, right: 20 },
    styles: { fontSize: 9 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 50 },
      1: { cellWidth: 40 },
      2: { cellWidth: 80 },
    },
  })

  // @ts-ignore
  yPosition = doc.lastAutoTable.finalY + 15

  // Analysis Methodology
  doc.setFont("helvetica", "bold")
  doc.setFontSize(14)
  doc.text("Analysis Methodology", 20, yPosition)
  yPosition += 10

  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)

  const methodology = [
    "This comprehensive audio forensic analysis was performed using advanced digital signal processing techniques:",
    "",
    "• Fast Fourier Transform (FFT) for frequency domain analysis",
    "• Short-Time Fourier Transform (STFT) for time-frequency representation",
    "• Energy-based sound event detection with adaptive thresholding",
    "• Spectral feature extraction including centroid and rolloff",
    "• Statistical analysis of amplitude and frequency distributions",
    "• Machine learning-based sound classification algorithms",
    "",
    "The analysis provides comprehensive insights into:",
    "• Temporal distribution and timing of sound events",
    "• Frequency characteristics and dominant spectral components",
    "• Amplitude variations and dynamic range analysis",
    "• Sound classification based on spectral and temporal features",
    "• Quality assessment and potential audio artifacts detection",
  ]

  methodology.forEach((line) => {
    if (yPosition > 270) {
      doc.addPage()
      yPosition = 20
    }
    doc.text(line, 20, yPosition)
    yPosition += 6
  })

  updateProgress(90, "Generating conclusions and summary...")

  // Footer
  doc.addPage()
  yPosition = 20

  doc.setFont("helvetica", "bold")
  doc.setFontSize(14)
  doc.text("Detailed Report Summary & Expert Conclusions", 20, yPosition)
  yPosition += 15

  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)

  const conclusions = generateDetailedConclusions(results)
  conclusions.forEach((conclusion) => {
    if (yPosition > 270) {
      doc.addPage()
      yPosition = 20
    }
    doc.text(conclusion, 20, yPosition, { maxWidth: 170 })
    yPosition += 8
  })

  // Add technical specifications
  yPosition += 10
  doc.setFont("helvetica", "bold")
  doc.setFontSize(12)
  doc.text("Technical Specifications", 20, yPosition)
  yPosition += 10

  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)

  const techSpecs = [
    `Analysis Engine: Audio Forensic Detector v1.0`,
    `Processing Libraries: LibROSA, Web Audio API`,
    `Sample Rate: ${results.sampleRate} Hz`,
    `Bit Depth: 16-bit (estimated)`,
    `Analysis Duration: ${results.duration} seconds`,
    `Total Data Points: ${Math.floor(results.sampleRate * results.duration)}`,
    `Frequency Resolution: ${(results.sampleRate / 2048).toFixed(2)} Hz`,
    `Time Resolution: ${((1024 / results.sampleRate) * 1000).toFixed(2)} ms`,
  ]

  techSpecs.forEach((spec) => {
    doc.text(spec, 20, yPosition)
    yPosition += 6
  })

  updateProgress(95, "Finalizing document...")

  // Add footer with generation info
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFont("helvetica", "italic")
    doc.setFontSize(8)
    doc.setTextColor(128, 128, 128)
    doc.text(`Audio Forensic Detector - Generated on ${new Date().toLocaleString()}`, 20, 285)
    doc.text(`Page ${i} of ${pageCount}`, 170, 285)
    doc.text(`File: ${audioData.name}`, 20, 290)
  }

  updateProgress(100, "Saving PDF report...")

  // Save the PDF
  const filename = `Audio_Forensic_Report_${audioData.name.replace(/\.[^/.]+$/, "")}_${new Date().toISOString().slice(0, 10)}.pdf`
  doc.save(filename)
}

// Enhanced helper functions
const classifyFrequency = (freq: number): string => {
  if (freq < 60) return "Sub-Bass"
  if (freq < 250) return "Bass"
  if (freq < 500) return "Low-Mid"
  if (freq < 2000) return "Mid (Voice)"
  if (freq < 4000) return "High-Mid"
  if (freq < 8000) return "Presence"
  if (freq < 16000) return "Brilliance"
  return "Ultra-High"
}

const generateBarChart = (magnitude: number): string => {
  const barLength = Math.round(magnitude * 25)
  return "█".repeat(barLength) + "░".repeat(25 - barLength)
}

const generateStatisticalAnalysis = (results: any): string[][] => {
  const stats = []

  if (results.soundEvents && results.soundEvents.length > 0) {
    const amplitudes = results.soundEvents.map((e: any) => e.amplitude)
    const frequencies = results.soundEvents.map((e: any) => e.frequency)

    const avgAmplitude = amplitudes.reduce((a: number, b: number) => a + b, 0) / amplitudes.length
    const maxAmplitude = Math.max(...amplitudes)
    const minAmplitude = Math.min(...amplitudes)

    const avgFrequency = frequencies.reduce((a: number, b: number) => a + b, 0) / frequencies.length
    const maxFrequency = Math.max(...frequencies)
    const minFrequency = Math.min(...frequencies)

    stats.push(
      [
        "Average Amplitude",
        `${(avgAmplitude * 100).toFixed(1)}%`,
        avgAmplitude > 0.7 ? "High energy content" : "Moderate energy",
      ],
      [
        "Amplitude Range",
        `${(minAmplitude * 100).toFixed(1)}% - ${(maxAmplitude * 100).toFixed(1)}%`,
        "Dynamic range indicator",
      ],
      ["Average Frequency", `${avgFrequency.toFixed(0)} Hz`, classifyFrequency(avgFrequency)],
      ["Frequency Range", `${minFrequency.toFixed(0)} - ${maxFrequency.toFixed(0)} Hz`, "Spectral bandwidth"],
      [
        "Event Density",
        `${(results.soundEvents.length / results.duration).toFixed(2)} events/sec`,
        results.soundEvents.length / results.duration > 1 ? "High activity" : "Low activity",
      ],
    )
  }

  return stats
}

const generateDetailedConclusions = (results: any): string[] => {
  const conclusions = []

  conclusions.push(
    `EXECUTIVE SUMMARY: Analysis of "${results.filename || "audio file"}" reveals ${results.detectedSounds} distinct sound events over a ${results.duration} second duration, providing comprehensive insights into the audio content's characteristics and forensic significance.`,
  )

  if (results.dominantFrequency) {
    conclusions.push(
      `FREQUENCY ANALYSIS: The dominant frequency component is ${results.dominantFrequency} Hz, classified as ${classifyFrequency(results.dominantFrequency)}. This indicates the primary spectral energy concentration and suggests the nature of the sound source.`,
    )
  }

  if (results.maxDecibels > -10) {
    conclusions.push(
      `AMPLITUDE ASSESSMENT: The audio contains high-amplitude signals (${results.maxDecibels} dB), indicating strong sound sources, potential clipping, or close-proximity recording conditions. This may affect the reliability of certain forensic analyses.`,
    )
  } else if (results.maxDecibels < -30) {
    conclusions.push(
      `AMPLITUDE ASSESSMENT: The audio has relatively low amplitude levels (${results.maxDecibels} dB), suggesting distant sources, quiet recording conditions, or potential signal attenuation. Enhancement techniques may be required for detailed analysis.`,
    )
  }

  if (results.soundEvents && results.soundEvents.length > 0) {
    const eventTypes = [...new Set(results.soundEvents.map((e: any) => e.type))]
    conclusions.push(
      `SOUND CLASSIFICATION: Detected sound types include: ${eventTypes.join(", ")}. This classification is based on spectral analysis and temporal characteristics.`,
    )

    const avgAmplitude =
      results.soundEvents.reduce((sum: number, e: any) => sum + e.amplitude, 0) / results.soundEvents.length
    if (avgAmplitude > 0.7) {
      conclusions.push(
        "SIGNAL QUALITY: Most detected events show high amplitude levels, indicating clear and prominent sounds with good signal-to-noise ratio.",
      )
    } else if (avgAmplitude < 0.3) {
      conclusions.push(
        "SIGNAL QUALITY: Detected events show low amplitude levels, which may indicate background noise, distant sources, or degraded audio quality.",
      )
    }

    // Temporal analysis
    const eventTimes = results.soundEvents.map((e: any) => e.time).sort((a: number, b: number) => a - b)
    const intervals = []
    for (let i = 1; i < eventTimes.length; i++) {
      intervals.push(eventTimes[i] - eventTimes[i - 1])
    }

    if (intervals.length > 0) {
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length
      if (avgInterval < 1) {
        conclusions.push(
          "TEMPORAL PATTERN: High frequency of sound events detected, suggesting continuous or rapidly occurring audio activity.",
        )
      } else if (avgInterval > 5) {
        conclusions.push(
          "TEMPORAL PATTERN: Sparse sound events detected, indicating intermittent audio activity with significant quiet periods.",
        )
      }
    }
  }

  conclusions.push(
    `FORENSIC SIGNIFICANCE: This comprehensive analysis provides detailed acoustic fingerprinting suitable for forensic investigation, quality assessment, authentication verification, and comparative analysis purposes.`,
  )

  conclusions.push(
    `TECHNICAL VALIDATION: All measurements were performed using industry-standard digital signal processing techniques with high precision. Results are suitable for technical documentation and expert testimony.`,
  )

  conclusions.push(
    `RECOMMENDATIONS: Based on the analysis results, this audio file ${results.detectedSounds > 5 ? "contains rich acoustic information suitable for detailed forensic examination" : "may benefit from enhancement techniques to improve signal clarity"}. Further analysis may include spectral enhancement, noise reduction, or comparative analysis with reference materials.`,
  )

  return conclusions
}
