import { useState, useEffect, useCallback } from 'react'
import { Layout } from '@/components/Layout'
import { useStore } from '@/store/useStore'
import { supabase } from '@/lib/supabase'
import type { GlossaryTerm, GlossaryExtractionResponse } from '@/types'

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GOOGLE_API_KEY
const GEMINI_MODEL = 'gemini-2.5-pro'

const EXTRACTION_PROMPT = `You are analyzing a document to extract UNUSUAL terms that automatic speech recognition (ASR) systems would likely mishear.

FIRST: Identify the primary language of this document.

Focus on terms that are:
- Made-up or coined words (e.g., company-specific jargon, invented terminology)
- Obscure proper nouns (niche people, places, organizations — NOT famous ones)
- Words transliterated inconsistently between languages
- Internal project names, codenames, or acronyms
- Technical terms specific to a narrow domain (not mainstream tech)
- Names with unusual spellings

DO NOT include:
- Common dictionary words in any language
- Well-known brands (Google, Microsoft, Amazon, etc.)
- Famous people or places
- Standard technical terms that ASR systems are trained on

CRITICAL CONSTRAINTS (Speechmatics Custom Dictionary limits):
1. MAXIMUM 6 WORDS per "content" entry - longer entries will be dropped by Speechmatics
2. MAXIMUM 6 WORDS per "sounds_like" variant - longer variants will be dropped
3. For full names like "Dr. Florbington McSnorgle", extract ONLY the unusual part: "Florbington" or "McSnorgle", not the whole name
4. sounds_like MUST use the same script as the language (Arabic script for Arabic, Latin for English, etc.)
5. Prefer single words or short phrases (1-3 words) over longer phrases

For each term, provide:
1. "content": The correct spelling IN THE DOCUMENT'S LANGUAGE/SCRIPT (max 6 words)
2. "sounds_like": 2-4 phonetic variants IN THE SAME SCRIPT (each max 6 words)

Examples by language:

English document:
{ "content": "Zubeyrify", "sounds_like": ["zoo bear ify", "zu bear ify"] }
{ "content": "Baiantech", "sounds_like": ["bay an tech", "buy an tech"] }
{ "content": "gnocchi", "sounds_like": ["nyohki", "nokey", "nochi"] }

Arabic document:
{ "content": "زبيرفاي", "sounds_like": ["زو بير فاي", "زبيري فاي"] }
{ "content": "بيانتك", "sounds_like": ["بيان تيك", "بايان تك"] }

WRONG (too many words - will be dropped):
{ "content": "Dr. Florbington McSnorgle the Third", "sounds_like": [...] }

CORRECT (extract the unusual part only):
{ "content": "Florbington", "sounds_like": ["floor bing ton", "florb ing ton"] }
{ "content": "McSnorgle", "sounds_like": ["mc snorgle", "mick snorgle"] }

Output ONLY valid JSON with this structure, no markdown, no explanation:
{
  "detected_language": "en or ar or fr or es or de etc.",
  "terms": [
    { "content": "TermHere", "sounds_like": ["variant 1", "variant 2"] }
  ]
}

If no unusual ASR-difficult terms are found, output:
{ "detected_language": "xx", "terms": [] }`

export function GlossaryPage() {
  const { user } = useStore()
  
  // Existing terms state
  const [existingTerms, setExistingTerms] = useState<GlossaryTerm[]>([])
  const [loadingTerms, setLoadingTerms] = useState(true)
  
  // Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [extracting, setExtracting] = useState(false)
  const [extractedTerms, setExtractedTerms] = useState<GlossaryExtractionResponse | null>(null)
  const [selectedTerms, setSelectedTerms] = useState<Set<number>>(new Set())
  
  // Status
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Load existing terms
  const loadTerms = useCallback(async () => {
    if (!user) return
    
    setLoadingTerms(true)
    try {
      const { data, error } = await supabase
        .from('glossary_terms')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setExistingTerms(data || [])
    } catch (err) {
      console.error('Failed to load glossary terms:', err)
    } finally {
      setLoadingTerms(false)
    }
  }, [user])

  useEffect(() => {
    loadTerms()
  }, [loadTerms])

  // File selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setExtractedTerms(null)
      setSelectedTerms(new Set())
      setError(null)
    }
  }

  // Extract terms from file
  const handleExtract = async () => {
    if (!selectedFile || !GEMINI_API_KEY) {
      setError('Missing file or API key')
      return
    }

    setExtracting(true)
    setError(null)
    setExtractedTerms(null)

    try {
      // Read file as base64
      const base64 = await readFileAsBase64(selectedFile)
      const mimeType = getMimeType(selectedFile.name)

      // Call Gemini API
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { inline_data: { mime_type: mimeType, data: base64 } },
                { text: EXTRACTION_PROMPT }
              ]
            }],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 8192,
            }
          })
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || 'API request failed')
      }

      const data = await response.json()
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
      
      // Parse JSON (handle markdown code blocks)
      let jsonStr = text.trim()
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
      }

      const extracted: GlossaryExtractionResponse = JSON.parse(jsonStr)
      setExtractedTerms(extracted)
      
      // Select all terms by default
      setSelectedTerms(new Set(extracted.terms.map((_: unknown, i: number) => i)))
      
    } catch (err) {
      console.error('Extraction failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to extract terms')
    } finally {
      setExtracting(false)
    }
  }

  // Toggle term selection
  const toggleTerm = (index: number) => {
    const newSelected = new Set(selectedTerms)
    if (newSelected.has(index)) {
      newSelected.delete(index)
    } else {
      newSelected.add(index)
    }
    setSelectedTerms(newSelected)
  }

  // Select/deselect all
  const toggleAll = () => {
    if (!extractedTerms) return
    if (selectedTerms.size === extractedTerms.terms.length) {
      setSelectedTerms(new Set())
    } else {
      setSelectedTerms(new Set(extractedTerms.terms.map((_: unknown, i: number) => i)))
    }
  }

  // Save selected terms to Supabase
  const handleSave = async () => {
    if (!extractedTerms || !user || selectedTerms.size === 0) return

    setError(null)
    setSuccess(null)

    try {
      const termsToInsert = extractedTerms.terms
        .filter((_: unknown, i: number) => selectedTerms.has(i))
        .map((term: { content: string; sounds_like: string[] }) => ({
          user_id: user.id,
          content: term.content,
          sounds_like: term.sounds_like,
          language: extractedTerms.detected_language,
        }))

      const { error } = await supabase
        .from('glossary_terms')
        .insert(termsToInsert)

      if (error) throw error

      setSuccess(`Added ${termsToInsert.length} terms to your glossary`)
      setExtractedTerms(null)
      setSelectedTerms(new Set())
      setSelectedFile(null)
      loadTerms()

      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error('Failed to save terms:', err)
      setError(err instanceof Error ? err.message : 'Failed to save terms')
    }
  }

  // Delete a term
  const handleDelete = async (termId: string) => {
    try {
      const { error } = await supabase
        .from('glossary_terms')
        .delete()
        .eq('id', termId)

      if (error) throw error
      setExistingTerms(prev => prev.filter(t => t.id !== termId))
    } catch (err) {
      console.error('Failed to delete term:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete term')
    }
  }

  // Clear all terms
  const handleClearAll = async () => {
    if (!user || !confirm('Delete all glossary terms? This cannot be undone.')) return

    try {
      const { error } = await supabase
        .from('glossary_terms')
        .delete()
        .eq('user_id', user.id)

      if (error) throw error
      setExistingTerms([])
      setSuccess('All terms cleared')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error('Failed to clear terms:', err)
      setError(err instanceof Error ? err.message : 'Failed to clear terms')
    }
  }

  return (
    <Layout>
      <div className="animate-fade-in">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>
            Glossary
          </h1>
          <p style={{ color: 'var(--color-text-muted)' }}>
            Add custom terms to improve speech recognition accuracy
          </p>
        </div>

        {/* Upload Section */}
        <div
          className="rounded-2xl p-6 mb-6"
          style={{
            background: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border)',
          }}
        >
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
            Extract Terms from Document
          </h2>

          <div className="space-y-4">
            {/* File input */}
            <div
              className="border-2 border-dashed rounded-xl p-6 text-center transition-colors"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <input
                type="file"
                id="fileInput"
                accept=".pdf,.txt,.doc,.docx,.md"
                onChange={handleFileSelect}
                className="hidden"
              />
              <label
                htmlFor="fileInput"
                className="cursor-pointer block"
              >
                <div className="mb-2">
                  <UploadIcon />
                </div>
                <p style={{ color: 'var(--color-text-muted)' }}>
                  {selectedFile ? selectedFile.name : 'Click to upload or drag & drop'}
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-dim)' }}>
                  PDF, TXT, DOC, DOCX, MD
                </p>
              </label>
            </div>

            {/* Extract button */}
            {selectedFile && !extractedTerms && (
              <button
                onClick={handleExtract}
                disabled={extracting}
                className="w-full py-3 rounded-xl font-medium transition-colors disabled:opacity-50"
                style={{
                  background: 'var(--color-accent)',
                  color: 'var(--color-bg)',
                }}
              >
                {extracting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Spinner /> Extracting with Gemini...
                  </span>
                ) : (
                  'Extract Terms'
                )}
              </button>
            )}
          </div>

          {/* Extracted Terms Preview */}
          {extractedTerms && extractedTerms.terms.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-medium" style={{ color: 'var(--color-text)' }}>
                    Extracted Terms
                  </h3>
                  <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    Language: {extractedTerms.detected_language} • {selectedTerms.size} of {extractedTerms.terms.length} selected
                  </p>
                </div>
                <button
                  onClick={toggleAll}
                  className="text-sm px-3 py-1 rounded-lg"
                  style={{
                    background: 'var(--color-bg)',
                    color: 'var(--color-text-muted)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  {selectedTerms.size === extractedTerms.terms.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto">
                {extractedTerms.terms.map((term: { content: string; sounds_like: string[] }, index: number) => (
                  <div
                    key={index}
                    onClick={() => toggleTerm(index)}
                    className="flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-colors"
                    style={{
                      background: selectedTerms.has(index) ? 'var(--color-accent-muted)' : 'var(--color-bg)',
                      border: `1px solid ${selectedTerms.has(index) ? 'var(--color-accent)' : 'var(--color-border)'}`,
                    }}
                  >
                    <div
                      className="w-5 h-5 rounded flex items-center justify-center mt-0.5 flex-shrink-0"
                      style={{
                        background: selectedTerms.has(index) ? 'var(--color-accent)' : 'transparent',
                        border: `2px solid ${selectedTerms.has(index) ? 'var(--color-accent)' : 'var(--color-border)'}`,
                      }}
                    >
                      {selectedTerms.has(index) && <CheckIcon />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium" style={{ color: 'var(--color-text)' }}>
                        {term.content}
                      </p>
                      <p className="text-sm truncate" style={{ color: 'var(--color-text-muted)' }}>
                        {term.sounds_like.join(' • ')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleSave}
                  disabled={selectedTerms.size === 0}
                  className="flex-1 py-3 rounded-xl font-medium transition-colors disabled:opacity-50"
                  style={{
                    background: 'var(--color-accent)',
                    color: 'var(--color-bg)',
                  }}
                >
                  Save {selectedTerms.size} Terms
                </button>
                <button
                  onClick={() => {
                    setExtractedTerms(null)
                    setSelectedTerms(new Set())
                    setSelectedFile(null)
                  }}
                  className="px-6 py-3 rounded-xl font-medium transition-colors"
                  style={{
                    background: 'var(--color-bg)',
                    color: 'var(--color-text-muted)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {extractedTerms && extractedTerms.terms.length === 0 && (
            <div className="mt-6 p-4 rounded-xl text-center" style={{ background: 'var(--color-bg)' }}>
              <p style={{ color: 'var(--color-text-muted)' }}>
                No unusual terms found in this document
              </p>
            </div>
          )}
        </div>

        {/* Status Messages */}
        {error && (
          <div
            className="px-4 py-3 rounded-xl text-sm mb-6"
            style={{ background: 'var(--color-danger-muted)', color: 'var(--color-danger)' }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            className="px-4 py-3 rounded-xl text-sm mb-6"
            style={{ background: 'var(--color-accent-muted)', color: 'var(--color-accent)' }}
          >
            {success}
          </div>
        )}

        {/* Existing Terms */}
        <div
          className="rounded-2xl p-6"
          style={{
            background: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border)',
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
                Your Glossary
              </h2>
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                {existingTerms.length} term{existingTerms.length !== 1 ? 's' : ''} • Used for speech recognition
              </p>
            </div>
            {existingTerms.length > 0 && (
              <button
                onClick={handleClearAll}
                className="text-sm px-3 py-1 rounded-lg transition-colors"
                style={{
                  color: 'var(--color-danger)',
                  border: '1px solid var(--color-danger)',
                }}
              >
                Clear All
              </button>
            )}
          </div>

          {loadingTerms ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : existingTerms.length === 0 ? (
            <div className="text-center py-8" style={{ color: 'var(--color-text-dim)' }}>
              <p>No glossary terms yet</p>
              <p className="text-sm mt-1">Upload a document to extract terms</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {existingTerms.map((term) => (
                <div
                  key={term.id}
                  className="flex items-start justify-between p-3 rounded-xl"
                  style={{
                    background: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium" style={{ color: 'var(--color-text)' }}>
                        {term.content}
                      </p>
                      <span
                        className="text-xs px-2 py-0.5 rounded"
                        style={{ background: 'var(--color-bg-hover)', color: 'var(--color-text-dim)' }}
                      >
                        {term.language}
                      </span>
                    </div>
                    <p className="text-sm truncate mt-1" style={{ color: 'var(--color-text-muted)' }}>
                      {term.sounds_like.join(' • ')}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(term.id)}
                    className="p-2 rounded-lg transition-colors hover:opacity-70"
                    style={{ color: 'var(--color-text-dim)' }}
                  >
                    <TrashIcon />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

// Helper functions
function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function getMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase()
  const mimeTypes: Record<string, string> = {
    pdf: 'application/pdf',
    txt: 'text/plain',
    md: 'text/markdown',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  }
  return mimeTypes[ext || ''] || 'application/octet-stream'
}

// Icons
function UploadIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--color-text-dim)', margin: '0 auto' }}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  )
}

function Spinner() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
      <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
    </svg>
  )
}

