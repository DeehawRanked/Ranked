import { supabase } from './supabase';

export interface Session {
  id: string;
  email: string;
  username: string;
}

export async function register(
  email: string,
  password: string,
  username: string,
): Promise<{ success: boolean; error?: string; needsVerification?: boolean; session?: Session }> {
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .ilike('username', username)
    .maybeSingle();

  if (existing) {
    return { success: false, error: 'That username is already taken.' };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username } },
  });

  if (error) return { success: false, error: error.message };
  if (!data.user) return { success: false, error: 'Something went wrong.' };

  // session is null when email confirmation is required
  if (!data.session) {
    return { success: true, needsVerification: true };
  }

  return {
    success: true,
    session: { id: data.user.id, email: data.user.email!, username },
  };
}

export async function signIn(
  email: string,
  password: string,
): Promise<{ success: boolean; error?: string; needsVerification?: boolean; session?: Session }> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const msg = error.message.toLowerCase().includes('email not confirmed')
      ? 'Please verify your email before signing in. Check your inbox for the verification link.'
      : 'Incorrect email or password.';
    return { success: false, error: msg };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', data.user.id)
    .single();

  return {
    success: true,
    session: {
      id: data.user.id,
      email: data.user.email!,
      username: profile?.username ?? '',
    },
  };
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

export async function deleteAccount(userId: string): Promise<void> {
  await supabase.from('profiles').delete().eq('id', userId);
  await supabase.auth.signOut();
}
