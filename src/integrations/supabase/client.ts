import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'https://jlaygpjhhjwcyoyrqpie.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpsYXlncGpoaGp3Y3lveXJxcGllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxODE1NzAsImV4cCI6MjA4Mzc1NzU3MH0.9CNS8Ar1A-q1JyUoGu7boIfEoqWNA50faVyQnWlmJP4'
)
