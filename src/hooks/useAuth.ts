import { useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { getMe, ApiError } from '@/lib/api'
import { useStore } from '@/store/useStore'

// Module-level guard - persists across hook instances
let authInitialized = false

/**
 * useAuth - Simple, explicit auth hook
 * 
 * Flow:
 * 1. On mount: getSession() to check if already logged in
 * 2. If session: fetchProfile() to get user data
 * 3. Set isAuthLoading = false (ALWAYS, even on error)
 * 4. onAuthStateChange handles future sign-in/sign-out events
 */
export function useAuth() {
  const navigate = useNavigate()
  const location = useLocation()
  
  const {
    user,
    isAuthLoading,
    needsOnboarding,
    setUser,
    setAuthLoading,
    setNeedsOnboarding,
    resetAuth,
  } = useStore()

  // Fetch user profile from API
  const fetchProfile = useCallback(async (): Promise<boolean> => {
    try {
      const profile = await getMe()
      setUser(profile)
      setNeedsOnboarding(false)
      return true
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        // User authenticated but no profile - needs onboarding
        setNeedsOnboarding(true)
        setUser(null)
        return true // Still "successful" - we know what to do
      }
      // Other errors
      console.error('Error fetching profile:', err)
      setUser(null)
      setNeedsOnboarding(false)
      return false
    }
  }, [setUser, setNeedsOnboarding])

  // Main auth initialization - runs ONCE per page load
  useEffect(() => {
    // Module-level guard prevents re-init on component remounts
    if (authInitialized) return
    authInitialized = true

    async function initAuth() {
      console.log('[useAuth] Initializing...')
      
      try {
        // Step 1: Check if user already has a session
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('[useAuth] getSession error:', error)
          setAuthLoading(false)
          return
        }

        if (session) {
          console.log('[useAuth] Session found, fetching profile...')
          await fetchProfile()
        } else {
          console.log('[useAuth] No session')
          setUser(null)
          setNeedsOnboarding(false)
        }
      } catch (err) {
        console.error('[useAuth] Init error:', err)
      } finally {
        // ALWAYS set loading to false
        console.log('[useAuth] Init complete, setting isAuthLoading=false')
        setAuthLoading(false)
      }
    }

    // Step 2: Set up listener for FUTURE auth events
    // IMPORTANT: Don't set loading states here - only update data
    // Loading states cause spinner flashes on session restore
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, _session) => {
        console.log('[useAuth] onAuthStateChange:', event)
        
        if (event === 'SIGNED_OUT') {
          resetAuth()
        }
        // SIGNED_IN is handled by initAuth() above via getSession()
        // Don't re-fetch here - it causes race conditions and spinner flashes
        // TOKEN_REFRESHED is automatic, no action needed
      }
    )

    // Run initialization
    initAuth()

    // Cleanup
    return () => {
      subscription.unsubscribe()
    }
  }, [fetchProfile, setUser, setAuthLoading, setNeedsOnboarding, resetAuth])

  // Redirect logic based on auth state
  useEffect(() => {
    if (isAuthLoading) return

    const isLoginPage = location.pathname === '/'
    const isOnboardingPage = location.pathname === '/onboarding'

    console.log('[useAuth] Redirect check:', { user: !!user, needsOnboarding, isLoginPage, isOnboardingPage })

    if (!user && !needsOnboarding) {
      // Not logged in - go to login
      if (!isLoginPage) {
        console.log('[useAuth] Redirecting to login')
        navigate('/', { replace: true })
      }
    } else if (needsOnboarding) {
      // Logged in but needs onboarding
      if (!isOnboardingPage) {
        console.log('[useAuth] Redirecting to onboarding')
        navigate('/onboarding', { replace: true })
      }
    } else if (user) {
      // Logged in with profile - redirect from login/onboarding
      if (isLoginPage || isOnboardingPage) {
        console.log('[useAuth] Redirecting to dashboard')
        navigate('/dashboard', { replace: true })
      }
    }
  }, [user, needsOnboarding, isAuthLoading, location.pathname, navigate])

  // Auth actions
  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    })
    if (error) {
      console.error('Google sign in error:', error)
      throw error
    }
  }, [])

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) {
      console.error('Email sign in error:', error)
      throw error
    }
  }, [])

  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    })
    if (error) {
      console.error('Email sign up error:', error)
      throw error
    }
  }, [])

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Sign out error:', error)
      throw error
    }
    // resetAuth is called by onAuthStateChange SIGNED_OUT event
  }, [])

  // Refresh profile (for after onboarding completes)
  const refreshProfile = useCallback(async () => {
    return fetchProfile()
  }, [fetchProfile])

  return {
    user,
    isAuthLoading,
    needsOnboarding,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    refreshProfile,
  }
}
