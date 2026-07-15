
-- ============ CARTS ============
CREATE TABLE public.carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  qty integer NOT NULL DEFAULT 1 CHECK (qty > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.carts TO authenticated;
GRANT ALL ON public.carts TO service_role;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own cart" ON public.carts
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ ORDERS ============
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  currency text NOT NULL DEFAULT 'USD',
  subtotal_cents bigint NOT NULL DEFAULT 0,
  tax_cents bigint NOT NULL DEFAULT 0,
  shipping_cents bigint NOT NULL DEFAULT 0,
  total_cents bigint NOT NULL DEFAULT 0,
  stripe_session_id text,
  stripe_payment_intent text,
  shipping_address jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own orders" ON public.orders
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users create own orders" ON public.orders
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  name text NOT NULL,
  price_cents bigint NOT NULL,
  qty integer NOT NULL,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own order items" ON public.order_items
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()));
CREATE POLICY "Users insert own order items" ON public.order_items
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()));

-- ============ updated_at trigger ============
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_carts_updated BEFORE UPDATE ON public.carts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ REALTIME ============
ALTER TABLE public.carts REPLICA IDENTITY FULL;
ALTER TABLE public.products REPLICA IDENTITY FULL;
ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.carts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- ============ SEED PRODUCTS ============
INSERT INTO public.products (name, description, price_cents, currency, category, stock, featured, image_url) VALUES
  ('Obsidian Tourbillon Automatic', 'Hand-finished flying tourbillon in obsidian-black ceramic with 18k gold indices.', 4290000, 'USD', 'Timepieces', 12, true, '/src/assets/product-2.jpg'),
  ('Grand Cru Reserve Decanter', 'Mouth-blown crystal decanter, gold-leaf collar, presented in a walnut vitrine.', 840000, 'USD', 'Spirits', 40, true, '/src/assets/product-1.jpg'),
  ('Onyx Executive Fountain Pen', 'Solid onyx barrel, 18k rhodium-plated nib, individually numbered.', 320000, 'USD', 'Writing', 25, false, '/src/assets/product-3.jpg'),
  ('Aurum Signature Leather Attaché', 'Full-grain calfskin attaché with gold hardware and silk lining.', 680000, 'USD', 'Leather', 18, true, '/src/assets/product-4.jpg')
ON CONFLICT DO NOTHING;
