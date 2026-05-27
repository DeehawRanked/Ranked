import { BoostTier } from './types';

const RC_API_KEY = 'test_akhgTnZDxuXAYBAIpBvafKomspR';

const PRODUCT_IDS: Record<BoostTier, string> = {
  spark: 'com.sultanazad.ranked.boost.spark',
  fire:  'com.sultanazad.ranked.boost.fire',
  viral: 'com.sultanazad.ranked.boost.viral',
};

let rcPlugin: any = null;

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
  if (rcPlugin) return rcPlugin;
  if (!(await isNative())) return null;
  try {
    const mod = await import('@revenuecat/purchases-capacitor');
    rcPlugin = mod.Purchases;
    return rcPlugin;
  } catch {
    return null;
  }
}

export async function initRevenueCat(userId: string): Promise<void> {
  const Purchases = await getPlugin();
  if (!Purchases) return;
  try {
    await Purchases.configure({ apiKey: RC_API_KEY, appUserID: userId });
  } catch {
    // already configured
  }
}

export async function purchaseBoost(tier: BoostTier): Promise<boolean> {
  const Purchases = await getPlugin();
  if (!Purchases) return false;

  try {
    const { products } = await Purchases.getProducts({
      productIdentifiers: [PRODUCT_IDS[tier]],
    });

    if (!products.length) return false;

    await Purchases.purchaseStoreProduct({ product: products[0] });
    return true;
  } catch (e: any) {
    if (e?.userCancelled) return false;
    throw e;
  }
}
