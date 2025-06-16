declare global {
  namespace NodeJS {
    interface ProcessEnv {
      EXPO_PUBLIC_SUPABASE_URL: string;
      EXPO_PUBLIC_SUPABASE_ANON_KEY: string;
      EXPO_PUBLIC_TERRA_API_KEY: string;
      EXPO_PUBLIC_TERRA_DEV_ID: string;
      EXPO_PUBLIC_AI_WEBHOOK_URL: string;
    }
  }
}

export {};