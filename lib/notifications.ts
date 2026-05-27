import { supabase } from './supabase';

let pushPlugin: any = null;

async function isNative(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    const { Capacitor } = await import('@capacitor/core');
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

async function getPlugin() {
  if (pushPlugin) return pushPlugin;
  if (!(await isNative())) return null;
  try {
    const mod = await import('@capacitor/push-notifications');
    pushPlugin = mod.PushNotifications;
    return pushPlugin;
  } catch {
    return null;
  }
}

async function saveToken(userId: string, token: string) {
  await supabase.from('device_tokens').upsert(
    { user_id: userId, token, platform: 'ios' },
    { onConflict: 'user_id,token' },
  );
}

export async function registerPushNotifications(userId: string): Promise<void> {
  const PushNotifications = await getPlugin();
  if (!PushNotifications) return;

  const { receive } = await PushNotifications.checkPermissions();
  let status = receive;

  if (status === 'prompt') {
    const result = await PushNotifications.requestPermissions();
    status = result.receive;
  }

  if (status !== 'granted') return;

  await PushNotifications.register();

  PushNotifications.addListener('registration', async (token: { value: string }) => {
    await saveToken(userId, token.value);
  });

  PushNotifications.addListener('pushNotificationReceived', (notification: any) => {
    console.log('Push received (foreground):', notification);
  });

  PushNotifications.addListener('pushNotificationActionPerformed', (action: any) => {
    console.log('Push tapped:', action);
  });
}

export async function unregisterPushNotifications(userId: string): Promise<void> {
  const PushNotifications = await getPlugin();
  if (!PushNotifications) return;
  await PushNotifications.removeAllListeners();
  await supabase.from('device_tokens').delete().eq('user_id', userId);
}
