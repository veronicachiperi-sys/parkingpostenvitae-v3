import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://eslrtxqbrgzdaodfaixu.supabase.co'
const supabaseKey = 'sb_publishable_6Zm55C2K6xoP0N4IrjbPTw_6gaizo47'

export const supabase = createClient(supabaseUrl, supabaseKey)