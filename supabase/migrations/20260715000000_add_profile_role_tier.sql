-- Add role and subscription_tier to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'member';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_tier text NOT NULL DEFAULT 'Elite';

-- Update trigger function to sync new metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, role, subscription_tier)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'member'),
    COALESCE(NEW.raw_user_meta_data->>'subscription_tier', 'Elite')
  )
  ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    subscription_tier = EXCLUDED.subscription_tier;
  RETURN NEW;
END;
$$;

-- Allow admin override RLS Policy
CREATE POLICY "Admins can update any profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (
    auth.jwt()->>'email' = 'gulshanqudratova715@gmail.com'
  )
  WITH CHECK (
    auth.jwt()->>'email' = 'gulshanqudratova715@gmail.com'
  );
