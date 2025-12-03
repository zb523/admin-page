import { SUPPORTED_LANGUAGES } from '@/types'
import { useLanguage } from '@/hooks/useLanguage'

interface LanguageSelectProps {
  value: string
  onChange: (value: string) => void
  label?: string
  id?: string
}

export function LanguageSelect({ value, onChange, label, id }: LanguageSelectProps) {
  const { t } = useLanguage()

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label htmlFor={id} className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
          {label}
        </label>
      )}
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-4 py-3 rounded-lg text-base transition-colors cursor-pointer"
        style={{
          background: 'var(--color-bg-elevated)',
          border: '1px solid var(--color-border)',
          color: 'var(--color-text)',
        }}
      >
        {Object.keys(SUPPORTED_LANGUAGES).map((code) => (
          <option key={code} value={code}>
            {t.languages[code as keyof typeof t.languages] || SUPPORTED_LANGUAGES[code]}
          </option>
        ))}
      </select>
    </div>
  )
}

interface MultiLanguageSelectProps {
  value: string[]
  onChange: (value: string[]) => void
  label?: string
  excludeLanguage?: string
}

export function MultiLanguageSelect({ value, onChange, label, excludeLanguage }: MultiLanguageSelectProps) {
  const { t } = useLanguage()
  
  const availableLanguages = Object.keys(SUPPORTED_LANGUAGES).filter(
    (code) => code !== excludeLanguage
  )

  const toggleLanguage = (code: string) => {
    if (value.includes(code)) {
      // Don't allow removing the last language
      if (value.length > 1) {
        onChange(value.filter((v) => v !== code))
      }
    } else {
      onChange([...value, code])
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
          {label}
        </label>
      )}
      <div className="flex flex-wrap gap-2">
        {availableLanguages.map((code) => {
          const isSelected = value.includes(code)
          const name = t.languages[code as keyof typeof t.languages] || SUPPORTED_LANGUAGES[code]
          
          return (
            <button
              key={code}
              type="button"
              onClick={() => toggleLanguage(code)}
              className="px-3 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: isSelected ? 'var(--color-chip-selected-bg)' : 'var(--color-bg-elevated)',
                border: `1px solid ${isSelected ? 'var(--color-chip-selected-border)' : 'var(--color-border)'}`,
                color: isSelected ? 'var(--color-text)' : 'var(--color-text-muted)',
                boxShadow: isSelected ? 'inset 0 1px 0 rgba(255,255,255,0.04)' : 'none',
              }}
            >
              {name}
            </button>
          )
        })}
      </div>
    </div>
  )
}
