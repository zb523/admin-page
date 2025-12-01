import { useLanguage } from '@/hooks/useLanguage'

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage()
  const isArabic = language === 'ar'

  const toggleLanguage = () => {
    setLanguage(isArabic ? 'en' : 'ar')
  }

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      aria-label={isArabic ? 'Switch to English' : 'Switch to Arabic'}
      title={isArabic ? 'Switch to English' : 'Switch to Arabic'}
      className="fixed top-4 end-20 z-50 shadow-xl transition-all duration-150"
      style={{
        width: '44px',
        height: '44px',
        borderRadius: '9999px',
        border: '1px solid var(--color-border)',
        background: 'var(--color-bg-elevated)',
        color: 'var(--color-text)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 12px 30px rgba(0, 0, 0, 0.18)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <LanguageIcon />
      <span className="ml-1 text-xs font-bold sr-only">{isArabic ? 'EN' : 'AR'}</span>
    </button>
  )
}

function LanguageIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  )
}

