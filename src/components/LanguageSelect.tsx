import { SUPPORTED_LANGUAGES } from '@/types'

interface LanguageSelectProps {
  value: string
  onChange: (value: string) => void
  label?: string
  id?: string
}

export function LanguageSelect({ value, onChange, label, id }: LanguageSelectProps) {
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
        {Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => (
          <option key={code} value={code}>
            {name}
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
  const availableLanguages = Object.entries(SUPPORTED_LANGUAGES).filter(
    ([code]) => code !== excludeLanguage
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
        {availableLanguages.map(([code, name]) => {
          const isSelected = value.includes(code)
          return (
            <button
              key={code}
              type="button"
              onClick={() => toggleLanguage(code)}
              className="px-3 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: isSelected ? 'var(--color-accent-muted)' : 'var(--color-bg-elevated)',
                border: `1px solid ${isSelected ? 'var(--color-accent)' : 'var(--color-border)'}`,
                color: isSelected ? 'var(--color-accent)' : 'var(--color-text-muted)',
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

