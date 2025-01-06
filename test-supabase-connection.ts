import { createClient } from '@supabase/supabase-js';

async function testSupabaseConnection() {
  // Get environment variables from Doppler
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in environment variables');
    process.exit(1);
  }

  console.log('Supabase URL:', supabaseUrl);
  
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    console.log('Testing Supabase connection...');
    
    // Try to fetch users table
    const { data, error } = await supabase
      .from('game_sessions')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Error connecting to Supabase:', error.message);
      process.exit(1);
    }

    console.log('Successfully connected to Supabase!');
    console.log('Sample data:', data);
    
  } catch (error) {
    console.error('Failed to connect to Supabase:', error);
    process.exit(1);
  }
}

testSupabaseConnection(); 