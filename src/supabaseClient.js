import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://vskqcbkzggkrzahdnlre.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZza3FjYmt6Z2drcnphaGRubHJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4OTgyOTksImV4cCI6MjA4MzQ3NDI5OX0.kJFRwcp0j5a4-KWLBDMnbDxaxBLHQ__K1d8aLiVao34'

export const supabase = createClient(supabaseUrl, supabaseKey)
