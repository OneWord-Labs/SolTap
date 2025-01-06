import { createClient } from '@supabase/supabase-js';

async function testSupabaseUser() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in environment variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    console.log('Fetching users from Supabase...');
    
    // First try to get users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (usersError) {
      console.error('Error fetching users:', usersError.message);
      process.exit(1);
    }

    if (users && users.length > 0) {
      console.log('Found user:', users[0]);
      
      // Now try to get this user's game sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from('game_sessions')
        .select(`
          *,
          users (
            username,
            telegram_id
          )
        `)
        .eq('user_id', users[0].id)
        .limit(5);

      if (sessionsError) {
        console.error('Error fetching sessions:', sessionsError.message);
      } else {
        console.log('User game sessions:', sessions);
      }
    } else {
      console.log('No users found in the database');
    }
    
  } catch (error) {
    console.error('Failed to fetch user data:', error);
    process.exit(1);
  }
}

testSupabaseUser(); 