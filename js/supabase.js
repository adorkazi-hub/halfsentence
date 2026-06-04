// ─────────────────────────────────────────────
//  halfsentence · Supabase Client
//  Replace the two values below with yours from:
//  Supabase Dashboard → Project Settings → API
// ─────────────────────────────────────────────

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const SUPABASE_URL = 'https://aptlpaobrtaefevpifuz.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwdGxwYW9icnRhZWZldnBpZnV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1Nzg5NzIsImV4cCI6MjA5NjE1NDk3Mn0.aaRAygpgy5mNH8_j3hAVj8tmojdstWlc_LhilGN3jkU'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
