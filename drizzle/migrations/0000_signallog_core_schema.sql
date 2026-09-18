-- PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE,
  handle text UNIQUE NOT NULL,
  display_name text NOT NULL,
  bio text,
  avatar_url text,
  website text,
  twitter text,
  location text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles are public" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- STARTUPS
CREATE TABLE public.startups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  tagline text NOT NULL,
  description text,
  category text NOT NULL,
  logo_letter text NOT NULL DEFAULT 'S',
  website text,
  location text,
  owner_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  verified boolean NOT NULL DEFAULT false,
  mrr integer NOT NULL DEFAULT 0,
  active_users integer NOT NULL DEFAULT 0,
  growth numeric NOT NULL DEFAULT 0,
  churn numeric NOT NULL DEFAULT 0,
  featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.startups TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.startups TO authenticated;
GRANT ALL ON public.startups TO service_role;
ALTER TABLE public.startups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "startups are public" ON public.startups FOR SELECT USING (true);
CREATE POLICY "owner insert startup" ON public.startups FOR INSERT TO authenticated
  WITH CHECK (owner_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));
CREATE POLICY "owner update startup" ON public.startups FOR UPDATE TO authenticated
  USING (owner_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));
CREATE POLICY "owner delete startup" ON public.startups FOR DELETE TO authenticated
  USING (owner_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- MILESTONES
CREATE TABLE public.milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id uuid NOT NULL REFERENCES public.startups(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'product',
  metric_label text,
  metric_value text,
  image_url text,
  link_url text,
  source text NOT NULL DEFAULT 'manual',
  verified boolean NOT NULL DEFAULT false,
  occurred_at date NOT NULL DEFAULT current_date,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.milestones TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.milestones TO authenticated;
GRANT ALL ON public.milestones TO service_role;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "milestones are public" ON public.milestones FOR SELECT USING (true);
CREATE POLICY "owner insert milestone" ON public.milestones FOR INSERT TO authenticated
  WITH CHECK (startup_id IN (SELECT s.id FROM public.startups s JOIN public.profiles p ON p.id = s.owner_id WHERE p.user_id = auth.uid()));
CREATE POLICY "owner update milestone" ON public.milestones FOR UPDATE TO authenticated
  USING (startup_id IN (SELECT s.id FROM public.startups s JOIN public.profiles p ON p.id = s.owner_id WHERE p.user_id = auth.uid()));
CREATE POLICY "owner delete milestone" ON public.milestones FOR DELETE TO authenticated
  USING (startup_id IN (SELECT s.id FROM public.startups s JOIN public.profiles p ON p.id = s.owner_id WHERE p.user_id = auth.uid()));

-- METRIC POINTS (chart series)
CREATE TABLE public.metric_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id uuid NOT NULL REFERENCES public.startups(id) ON DELETE CASCADE,
  period date NOT NULL,
  mrr integer NOT NULL DEFAULT 0,
  active_users integer NOT NULL DEFAULT 0,
  verified boolean NOT NULL DEFAULT true,
  UNIQUE (startup_id, period)
);
GRANT SELECT ON public.metric_points TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.metric_points TO authenticated;
GRANT ALL ON public.metric_points TO service_role;
ALTER TABLE public.metric_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY "metrics are public" ON public.metric_points FOR SELECT USING (true);
CREATE POLICY "owner write metrics" ON public.metric_points FOR ALL TO authenticated
  USING (startup_id IN (SELECT s.id FROM public.startups s JOIN public.profiles p ON p.id = s.owner_id WHERE p.user_id = auth.uid()))
  WITH CHECK (startup_id IN (SELECT s.id FROM public.startups s JOIN public.profiles p ON p.id = s.owner_id WHERE p.user_id = auth.uid()));

-- INTEGRATIONS
CREATE TABLE public.integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id uuid NOT NULL REFERENCES public.startups(id) ON DELETE CASCADE,
  provider text NOT NULL,
  status text NOT NULL DEFAULT 'disconnected',
  mode text NOT NULL DEFAULT 'demo',
  account_label text,
  last_synced_at timestamptz,
  UNIQUE (startup_id, provider)
);
GRANT SELECT ON public.integrations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.integrations TO authenticated;
GRANT ALL ON public.integrations TO service_role;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "integrations are public" ON public.integrations FOR SELECT USING (true);
CREATE POLICY "owner write integrations" ON public.integrations FOR ALL TO authenticated
  USING (startup_id IN (SELECT s.id FROM public.startups s JOIN public.profiles p ON p.id = s.owner_id WHERE p.user_id = auth.uid()))
  WITH CHECK (startup_id IN (SELECT s.id FROM public.startups s JOIN public.profiles p ON p.id = s.owner_id WHERE p.user_id = auth.uid()));

-- FOLLOWS
CREATE TABLE public.follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id uuid NOT NULL REFERENCES public.startups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (startup_id, user_id)
);
GRANT SELECT ON public.follows TO anon;
GRANT SELECT, INSERT, DELETE ON public.follows TO authenticated;
GRANT ALL ON public.follows TO service_role;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "follows are public" ON public.follows FOR SELECT USING (true);
CREATE POLICY "own follow insert" ON public.follows FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "own follow delete" ON public.follows FOR DELETE TO authenticated USING (user_id = auth.uid());

-- REACTIONS (like / bookmark)
CREATE TABLE public.reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  milestone_id uuid NOT NULL REFERENCES public.milestones(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  kind text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (milestone_id, user_id, kind)
);
GRANT SELECT ON public.reactions TO anon;
GRANT SELECT, INSERT, DELETE ON public.reactions TO authenticated;
GRANT ALL ON public.reactions TO service_role;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reactions are public" ON public.reactions FOR SELECT USING (true);
CREATE POLICY "own reaction insert" ON public.reactions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "own reaction delete" ON public.reactions FOR DELETE TO authenticated USING (user_id = auth.uid());

-- NOTIFICATIONS
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  kind text NOT NULL DEFAULT 'system',
  title text NOT NULL,
  body text,
  link text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own notifications" ON public.notifications FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, handle, display_name)
  VALUES (
    NEW.id,
    lower(regexp_replace(split_part(coalesce(NEW.email, 'founder'), '@', 1), '[^a-z0-9]+', '', 'g')) || '-' || substr(NEW.id::text, 1, 4),
    coalesce(NEW.raw_user_meta_data->>'display_name', split_part(coalesce(NEW.email, 'Founder'), '@', 1))
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ================= DEMO DATA =================
INSERT INTO public.profiles (id, handle, display_name, bio, location, twitter, website) VALUES
 ('11111111-1111-1111-1111-111111111101','maya','Maya Okonjo','Building developer analytics that respect privacy. Third company, first one in public.','San Francisco','mayabuilds','https://maya.dev'),
 ('11111111-1111-1111-1111-111111111102','dev','Devin Ash','Infra nerd. Shipping Lumenstack edge runtime with two people and a lot of coffee.','Berlin','devinash',NULL),
 ('11111111-1111-1111-1111-111111111103','sana','Sana Iqbal','Email should feel calm. Bootstrapped, four founders, one inbox.','Lahore','sanaiq',NULL),
 ('11111111-1111-1111-1111-111111111104','theo','Theo Marchand','Solo founder. Security tooling for teams that cannot afford a breach.','Lyon',NULL,NULL);

INSERT INTO public.startups (id, slug, name, tagline, description, category, logo_letter, website, location, owner_id, verified, mrr, active_users, growth, churn, featured) VALUES
 ('22222222-2222-2222-2222-222222222201','northbeam','Northbeam','Realtime product analytics for indie teams','Northbeam gives small teams the analytics depth of an enterprise stack without the cookie banners. Self-serve, privacy-first, and fast enough to leave open all day.','Analytics','N','https://northbeam.example','San Francisco','11111111-1111-1111-1111-111111111101',true,48200,12340,18.4,2.3,true),
 ('22222222-2222-2222-2222-222222222202','lumenstack','Lumenstack','Edge runtime for background jobs','Queue, schedule and observe background jobs at the edge. One binary, no Kubernetes, sub-50ms cold starts.','Infrastructure','L','https://lumenstack.example','Berlin','11111111-1111-1111-1111-111111111102',true,22100,3890,64.0,1.8,true),
 ('22222222-2222-2222-2222-222222222203','hearthmail','Hearthmail','A calmer inbox for small teams','Shared inboxes without the helpdesk baggage. Threads, notes and assignments that feel like email, not a ticket system.','Productivity','H','https://hearthmail.example','Lahore','11111111-1111-1111-1111-111111111103',false,9400,1205,12.0,4.1,true),
 ('22222222-2222-2222-2222-222222222204','vantablock','Vantablock','Secrets scanning built for small teams','Vantablock watches your repos and cloud config for leaked credentials and gives you a one-click rotation path.','Security','V','https://vantablock.example','Lyon','11111111-1111-1111-1111-111111111104',true,15700,2410,31.0,2.9,false),
 ('22222222-2222-2222-2222-222222222205','tideline','Tideline','Revenue forecasting for subscription apps','Plug in Stripe and see the next twelve months of revenue with cohorts, churn bands and scenario planning.','Fintech','T','https://tideline.example','Lisbon','11111111-1111-1111-1111-111111111101',true,31400,5120,22.5,3.2,false),
 ('22222222-2222-2222-2222-222222222206','fernpath','Fernpath','Onboarding flows without engineers','Drag-and-drop product tours and checklists that read your own events, shipped by the people who own activation.','SaaS','F','https://fernpath.example','Toronto','11111111-1111-1111-1111-111111111102',false,6800,940,9.4,5.0,false);

INSERT INTO public.milestones (startup_id, title, description, category, metric_label, metric_value, source, verified, occurred_at) VALUES
 ('22222222-2222-2222-2222-222222222201','Reached $48.2K MRR','Third month of compounding growth after the self-serve pricing change. Enterprise pilots not counted yet.','revenue','MRR','$48,200','stripe',true,'2026-03-14'),
 ('22222222-2222-2222-2222-222222222201','Shipped v2.0 dashboard','Rebuilt the query layer, dashboards now load in under 300ms on a million events.','product','Load time','290ms','github',true,'2026-03-02'),
 ('22222222-2222-2222-2222-222222222201','12,000 active users','Crossed twelve thousand weekly active users across 840 workspaces.','users','WAU','12,340','stripe',true,'2026-02-20'),
 ('22222222-2222-2222-2222-222222222201','Closing a $2M seed','Term sheet signed, closing paperwork in progress. Numbers here are self-reported until the wire lands.','funding','Round','$2M','manual',false,'2026-02-08'),
 ('22222222-2222-2222-2222-222222222202','$22.1K MRR after pricing rework','Moved from seat pricing to job-run pricing. Churn dropped by half in six weeks.','revenue','MRR','$22,100','stripe',true,'2026-03-11'),
 ('22222222-2222-2222-2222-222222222202','Edge runtime hits 47ms cold start','Rewrote the scheduler in Rust and cut cold starts by 60%.','product','Cold start','47ms','github',true,'2026-02-27'),
 ('22222222-2222-2222-2222-222222222202','First 100 paying teams','Hundred teams paying, all inbound from the changelog.','users','Paying teams','100','manual',false,'2026-01-30'),
 ('22222222-2222-2222-2222-222222222203','$9.4K MRR','Slow month, two enterprise trials stalled. Publishing anyway.','revenue','MRR','$9,400','manual',false,'2026-03-09'),
 ('22222222-2222-2222-2222-222222222203','Launched shared notes','Internal notes on any thread, plus mentions. Biggest ask from our first fifty customers.','launch','Feature','Shared notes','github',true,'2026-02-18'),
 ('22222222-2222-2222-2222-222222222204','$15.7K MRR and cash-flow positive','Solo founder, no funding, profitable since November.','revenue','MRR','$15,700','stripe',true,'2026-03-12'),
 ('22222222-2222-2222-2222-222222222204','Scanned 1M repositories','Public scanning corpus crossed a million repos, 14k leaked keys reported.','product','Repos','1,000,000','github',true,'2026-02-05'),
 ('22222222-2222-2222-2222-222222222205','$31.4K MRR','Forecast accuracy is now the main sales pitch: 3.1% mean error over six months.','revenue','MRR','$31,400','stripe',true,'2026-03-13'),
 ('22222222-2222-2222-2222-222222222205','Shipped scenario planning','Model price changes and churn bands side by side.','launch','Feature','Scenarios','github',true,'2026-02-22'),
 ('22222222-2222-2222-2222-222222222206','$6.8K MRR','First paid month after leaving free beta. 41 of 300 beta teams converted.','revenue','MRR','$6,800','manual',false,'2026-03-06'),
 ('22222222-2222-2222-2222-222222222206','Public beta open','Opened the waitlist, 300 teams in the first week.','launch','Beta teams','300','manual',false,'2026-01-19');

INSERT INTO public.integrations (startup_id, provider, status, mode, account_label, last_synced_at) VALUES
 ('22222222-2222-2222-2222-222222222201','stripe','connected','demo','acct_northbeam_demo', now() - interval '2 hours'),
 ('22222222-2222-2222-2222-222222222201','github','connected','demo','northbeam/analytics', now() - interval '40 minutes'),
 ('22222222-2222-2222-2222-222222222202','stripe','connected','demo','acct_lumenstack_demo', now() - interval '5 hours'),
 ('22222222-2222-2222-2222-222222222202','github','connected','demo','lumenstack/runtime', now() - interval '1 hour'),
 ('22222222-2222-2222-2222-222222222203','stripe','disconnected','demo',NULL,NULL),
 ('22222222-2222-2222-2222-222222222204','stripe','connected','demo','acct_vantablock_demo', now() - interval '9 hours'),
 ('22222222-2222-2222-2222-222222222205','stripe','connected','demo','acct_tideline_demo', now() - interval '3 hours');

INSERT INTO public.metric_points (startup_id, period, mrr, active_users, verified)
SELECT s.id,
       (date_trunc('month', current_date) - ((11 - g) || ' months')::interval)::date,
       round(s.mrr / power(1 + (s.growth / 100.0) / 3.0, 11 - g))::int,
       round(s.active_users / power(1 + (s.growth / 100.0) / 4.0, 11 - g))::int,
       CASE WHEN g = 11 AND NOT s.verified THEN false ELSE true END
FROM public.startups s CROSS JOIN generate_series(0, 11) AS g;

INSERT INTO public.follows (startup_id, user_id)
SELECT s.id, p.id FROM public.startups s CROSS JOIN public.profiles p WHERE p.id <> coalesce(s.owner_id, p.id);