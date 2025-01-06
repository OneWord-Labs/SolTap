import { createClient } from '@supabase/supabase-js';

interface GameSession {
  id: string;
  user_id: string;
  score: number;
  completed: boolean;
}

interface User {
  id: string;
  telegram_id: string;
  username: string;
  total_score: number;
  highest_score: number;
}

export class PointsService {
  private supabase;
  private userId: string;
  private currentSession: GameSession | null = null;
  private currentUser: User | null = null;

  constructor(supabaseUrl: string, supabaseKey: string, telegramId: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.userId = telegramId;
  }

  async init(): Promise<User | null> {
    // First get or create user
    const { data: user, error: userError } = await this.supabase
      .from('users')
      .select('*')
      .eq('telegram_id', this.userId)
      .single();

    if (userError) {
      console.error('Error fetching user:', userError);
      return null;
    }

    this.currentUser = user;
    return user;
  }

  async startSession(): Promise<void> {
    if (!this.currentUser) {
      await this.init();
    }

    const { data, error } = await this.supabase
      .from('game_sessions')
      .insert({
        user_id: this.currentUser?.id,
        score: 0,
        completed: false
      })
      .select()
      .single();

    if (error) throw error;
    this.currentSession = data;
  }

  async updateScore(score: number): Promise<void> {
    if (!this.currentSession) return;

    const { error } = await this.supabase
      .from('game_sessions')
      .update({ score })
      .eq('id', this.currentSession.id);

    if (error) throw error;
    this.currentSession.score = score;

    // Also update user's highest score if applicable
    if (this.currentUser && score > this.currentUser.highest_score) {
      const { error: userError } = await this.supabase
        .from('users')
        .update({ 
          highest_score: score,
          total_score: this.currentUser.total_score + score
        })
        .eq('id', this.currentUser.id);

      if (userError) throw userError;
      this.currentUser.highest_score = score;
    }
  }

  async endSession(finalScore: number): Promise<void> {
    if (!this.currentSession) return;

    const { error } = await this.supabase
      .from('game_sessions')
      .update({
        score: finalScore,
        completed: true
      })
      .eq('id', this.currentSession.id);

    if (error) throw error;
  }

  async convertPoints(amount: number): Promise<void> {
    if (!this.currentSession) return;

    const { error } = await this.supabase
      .functions.invoke('points', {
        body: {
          game_session_id: this.currentSession.id,
          points_amount: amount
        }
      });

    if (error) throw error;
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }
} 