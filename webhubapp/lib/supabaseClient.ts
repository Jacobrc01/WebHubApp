import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://oaeqzxceykpxblfkatxp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hZXF6eGNleWtweGJsZmthdHhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NjUxODcsImV4cCI6MjA2NjQ0MTE4N30.oHZwOXauZCmGvBbM1awGuSZ2vKJKIqOzNFWSDgiUsio';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
