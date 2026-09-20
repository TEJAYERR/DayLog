import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, CircleHelp, Clock3, Compass, FileText, Home as HomeIcon, Loader2, LogOut, MapPin, Menu, MessageCircle, Plus, Search, Settings, Sparkles, Trash2, X, type LucideIcon } from 'lucide-react';
import { Link, Route, Switch, useLocation } from 'wouter';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ApiError } from '@/api/client';
import { createEvent, deleteEvent, demoLocation, getEvents } from '@/api/events';
import { createPlace, deletePlace, getPlaces } from '@/api/places';
import { askDay, explainDay } from '@/api/ai';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();
const today = () => new Date().toISOString().slice(0, 10);
const prettyDate = (date: string) => new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date(`${date}T12:00:00`));
const shiftDate = (date: string, amount: number) => { const next = new Date(`${date}T12:00:00`); next.setDate(next.getDate() + amount); return next.toISOString().slice(0, 10); };
const first = (value: any, keys: string[], fallback: any = ''): any => { for (const key of keys) if (value?.[key] !== undefined && value?.[key] !== null) return value[key]; return fallback; };
const eventValue = (event: any, keys: string[], fallback: any = ''): any => first(event, keys, first(event?.event || event?.activity || event?.locationEvent, keys, fallback));

function Button({ children, className = '', variant = 'primary', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'quiet' | 'outline' | 'danger' }) {
  const styles = { primary: 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90', quiet: 'bg-transparent text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]', outline: 'border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] hover:border-[hsl(var(--accent))]', danger: 'border border-[hsl(var(--destructive)/.3)] text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive)/.08)]' };
  return <button {...props} className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`}>{children}</button>;
}

function Field({ label, error, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  return <label className="block space-y-1.5"><span className="text-xs font-semibold tracking-wide text-[hsl(var(--muted-foreground))]">{label}</span><input {...props} className="w-full rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--card))] px-3.5 py-3 text-sm text-[hsl(var(--foreground))] outline-none transition focus:border-[hsl(var(--accent))] focus:ring-2 focus:ring-[hsl(var(--accent)/.16)] placeholder:text-[hsl(var(--muted-foreground)/.7)]" />{error && <span className="text-xs text-[hsl(var(--destructive))]">{error}</span>}</label>;
}

function AppLogo({ dark = false }: { dark?: boolean }) {
  return <div className="flex items-center gap-2.5"><span className={`grid h-8 w-8 place-items-center rounded-full ${dark ? 'bg-[hsl(var(--sidebar-primary))] text-[hsl(var(--sidebar-primary-foreground))]' : 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'}`}><Clock3 size={16} strokeWidth={2.5} /></span><span className="font-display text-xl font-semibold tracking-tight">daylog</span></div>;
}

function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const { signIn, signUp, token } = useAuth();
  const [, setLocation] = useLocation();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (token) setLocation('/'); }, [token, setLocation]);
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError('');
    if (!form.email || !form.password || (mode === 'register' && !form.name)) return setError('Please complete every required field.');
    if (mode === 'register' && form.password !== form.confirm) return setError('Those passwords do not match.');
    if (form.password.length < 8) return setError('Use at least 8 characters for your password.');
    setBusy(true);
    try { mode === 'login' ? await signIn(form.email, form.password) : await signUp(form.name, form.email, form.password); } catch (err) { setError(err instanceof ApiError ? err.message : 'We could not complete that request.'); } finally { setBusy(false); }
  };
  return <main className="daylog-grain flex min-h-[100dvh] bg-[hsl(var(--background))]">
    <section className="relative hidden w-[44%] overflow-hidden bg-[hsl(var(--sidebar))] p-12 text-[hsl(var(--sidebar-foreground))] lg:flex lg:flex-col lg:justify-between">
      <div><AppLogo dark /><div className="mt-28 max-w-sm"><p className="font-mono text-xs uppercase tracking-[.23em] text-[hsl(var(--sidebar-primary))]">a place for the day</p><h1 className="mt-5 font-display text-6xl leading-[.98] tracking-tight">Remember<br /><em className="text-[hsl(var(--sidebar-primary))]">where life went.</em></h1><p className="mt-7 max-w-xs text-sm leading-6 text-[hsl(var(--sidebar-foreground)/.7)]">DayLog gently brings your notes and places back together, so the shape of a day can find you again.</p></div></div>
      <div className="flex items-end justify-between text-xs text-[hsl(var(--sidebar-foreground)/.48)]"><span>Personal memory, kept close.</span><span className="font-mono">01 / 24</span></div>
      <div className="absolute -bottom-28 -right-24 h-80 w-80 rounded-full border border-[hsl(var(--sidebar-primary)/.3)]" /><div className="absolute bottom-8 right-8 h-44 w-44 rounded-full border border-[hsl(var(--sidebar-primary)/.15)]" />
    </section>
    <section className="flex flex-1 items-center justify-center px-5 py-12 sm:px-10"><div className="w-full max-w-[420px] animate-rise">
      <div className="mb-10 lg:hidden"><AppLogo /></div>
      <p className="font-mono text-xs uppercase tracking-[.2em] text-[hsl(var(--accent))]">{mode === 'login' ? 'welcome back' : 'make room for memory'}</p>
      <h2 className="mt-3 font-display text-4xl tracking-tight text-[hsl(var(--foreground))]">{mode === 'login' ? 'Pick up the thread.' : 'Start your daylog.'}</h2>
      <p className="mt-3 text-sm leading-6 text-[hsl(var(--muted-foreground))]">{mode === 'login' ? 'Your recorded days are waiting quietly.' : 'A private place to keep the moments worth finding later.'}</p>
      <form onSubmit={submit} className="mt-8 space-y-5">
        {mode === 'register' && <Field label="Your name" placeholder="How should we call you?" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} data-testid="input-name" autoComplete="name" />}
        <Field label="Email address" type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} data-testid="input-email" autoComplete="email" />
        <Field label="Password" type="password" placeholder="At least 8 characters" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} data-testid="input-password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
        {mode === 'register' && <Field label="Confirm password" type="password" placeholder="Type it once more" value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })} data-testid="input-confirm-password" autoComplete="new-password" />}
        {error && <p role="alert" className="rounded-lg bg-[hsl(var(--destructive)/.09)] px-3 py-2.5 text-sm text-[hsl(var(--destructive))]">{error}</p>}
        <Button type="submit" className="w-full py-3" disabled={busy} data-testid="button-submit-auth">{busy ? <><Loader2 size={16} className="animate-spin" />{mode === 'login' ? 'Opening your daylog…' : 'Making your space…'}</> : mode === 'login' ? 'Sign in' : 'Create account'}</Button>
      </form>
      <p className="mt-7 text-center text-sm text-[hsl(var(--muted-foreground))]">{mode === 'login' ? 'New to DayLog? ' : 'Already have a daylog? '}<Link href={mode === 'login' ? '/register' : '/login'} className="font-semibold text-[hsl(var(--accent))] hover:underline" data-testid="link-switch-auth">{mode === 'login' ? 'Create an account' : 'Sign in'}</Link></p>
    </div></section>
  </main>;
}

function Shell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { user, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const nav: { href: string; label: string; icon: LucideIcon }[] = [{ href: '/', label: 'Today', icon: HomeIcon }, { href: '/timeline', label: 'Timeline', icon: CalendarDays }, { href: '/places', label: 'Places', icon: MapPin }, { href: '/settings', label: 'Settings', icon: Settings }];
  return <div className="daylog-grain min-h-[100dvh] bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[238px] flex-col border-r border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar))] px-5 py-6 text-[hsl(var(--sidebar-foreground))] md:flex">
      <AppLogo dark /><p className="mt-1 pl-10 font-mono text-[9px] uppercase tracking-[.22em] text-[hsl(var(--sidebar-foreground)/.45)]">personal time capsule</p>
      <nav className="mt-16 space-y-1">{nav.map(item => { const Icon = item.icon; const active = location === item.href || (item.href === '/' && location === '/'); return <Link key={item.href} href={item.href} className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition ${active ? 'bg-[hsl(var(--sidebar-accent))] font-semibold text-[hsl(var(--sidebar-primary))]' : 'text-[hsl(var(--sidebar-foreground)/.66)] hover:bg-[hsl(var(--sidebar-accent)/.6)] hover:text-[hsl(var(--sidebar-foreground))]'}`} data-testid={`link-nav-${item.label.toLowerCase()}`}><Icon size={17} />{item.label}</Link>; })}</nav>
      <div className="mt-auto rounded-xl border border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar-accent)/.55)] p-4"><p className="font-display text-lg leading-tight">The day is<br /><em className="text-[hsl(var(--sidebar-primary))]">still yours</em> to find.</p><p className="mt-3 text-[10px] leading-4 text-[hsl(var(--sidebar-foreground)/.5)]">Your notes stay private to you.</p></div>
      <div className="mt-5 flex items-center gap-3 border-t border-[hsl(var(--sidebar-border))] pt-5"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[hsl(var(--sidebar-primary)/.2)] text-xs font-semibold text-[hsl(var(--sidebar-primary))]">{(user?.name || user?.email || 'D').slice(0, 1).toUpperCase()}</span><span className="min-w-0 flex-1 truncate text-xs">{user?.name || user?.email || 'Your account'}</span><button aria-label="Log out" onClick={signOut} className="text-[hsl(var(--sidebar-foreground)/.55)] hover:text-[hsl(var(--sidebar-primary))]" data-testid="button-logout-sidebar"><LogOut size={15} /></button></div>
    </aside>
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[hsl(var(--border)/.7)] bg-[hsl(var(--background)/.92)] px-5 backdrop-blur md:hidden"><button onClick={() => setMobileOpen(!mobileOpen)} aria-label="Open navigation" data-testid="button-open-mobile-nav"><Menu size={21} /></button><AppLogo /><Link href="/settings" aria-label="Open settings" data-testid="link-mobile-settings"><span className="grid h-8 w-8 place-items-center rounded-full bg-[hsl(var(--primary))] text-xs font-semibold text-[hsl(var(--primary-foreground))]">{(user?.name || user?.email || 'D').slice(0, 1).toUpperCase()}</span></Link></header>
    {mobileOpen && <div className="fixed inset-0 z-50 bg-[hsl(var(--sidebar))] p-6 text-[hsl(var(--sidebar-foreground))] md:hidden animate-rise"><div className="flex items-center justify-between"><AppLogo dark /><button onClick={() => setMobileOpen(false)} aria-label="Close navigation" data-testid="button-close-mobile-nav"><X /></button></div><nav className="mt-16 space-y-2">{nav.map(item => { const Icon = item.icon; return <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-4 text-base text-[hsl(var(--sidebar-foreground)/.8)] hover:bg-[hsl(var(--sidebar-accent))]" data-testid={`link-mobile-${item.label.toLowerCase()}`}><Icon size={19} />{item.label}</Link>; })}</nav><button onClick={signOut} className="mt-10 flex items-center gap-3 px-3 py-4 text-sm text-[hsl(var(--sidebar-primary))]" data-testid="button-logout-mobile"><LogOut size={18} />Log out</button></div>}
    <main className="md:pl-[238px]">{children}</main>
  </div>;
}

function DateNav({
  date,
  setDate,
}: {
  date: string;
  setDate: (date: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        className="h-9 w-9 shrink-0 p-0"
        onClick={() => setDate(shiftDate(date, -1))}
        aria-label="Previous day"
        data-testid="button-previous-day"
      >
        <ChevronLeft size={17} />
      </Button>

      <button
        className="group flex items-center gap-2 rounded-lg px-2 py-2 text-left hover:bg-[hsl(var(--muted))]"
        onClick={() => setDate(today())}
        data-testid="button-date-today"
      >
        <CalendarDays
          size={15}
          className="text-[hsl(var(--accent))]"
        />

        <span className="font-mono text-xs uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
          {date === today() ? 'Today' : prettyDate(date)}
        </span>
      </button>

      <Button
        variant="outline"
        className="h-9 w-9 shrink-0 p-0"
        onClick={() => setDate(shiftDate(date, 1))}
        aria-label="Next day"
        data-testid="button-next-day"
      >
        <ChevronRight size={17} />
      </Button>
    </div>
  );
}

function Timeline({ events, busy, onDelete }: { events: any[]; busy: boolean; onDelete: (id: string | number) => void }) {
  if (busy) return <div className="space-y-5 pl-1">{[1, 2, 3].map(i => <div key={i} className="flex gap-5 animate-soft-pulse"><div className="w-12 pt-2"><div className="h-3 w-10 rounded bg-[hsl(var(--muted))]" /></div><div className="h-24 flex-1 rounded-xl bg-[hsl(var(--muted))]" /></div>)}</div>;
  if (!events.length) return <div className="rounded-2xl border border-dashed border-[hsl(var(--border))] px-6 py-16 text-center"><span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-[hsl(var(--muted))] text-[hsl(var(--accent))]"><Compass size={20} /></span><h3 className="mt-4 font-display text-2xl">A blank page, for now.</h3><p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-[hsl(var(--muted-foreground))]">Add something you remember, or let DayLog listen for a place event.</p></div>;
  return <div className="relative space-y-0 before:absolute before:bottom-6 before:left-[58px] before:top-6 before:w-px before:bg-[hsl(var(--border))] sm:before:left-[74px]">{events.map((event, index) => { const id = first(event, ['id', 'eventId'], index); const type = String(eventValue(event, ['eventType', 'type'], 'ACTIVITY')).toUpperCase(); const automatic = type.includes('LOCATION') || String(eventValue(event, ['source'], '')).toUpperCase() !== 'MANUAL'; const time = eventValue(event, ['time', 'startTime', 'timestamp', 'occurredAt'], '—'); const title = eventValue(event, ['title', 'name'], automatic ? `${String(eventValue(event, ['action'], 'Arrived')).toLowerCase()} ${eventValue(event, ['placeName', 'place'], 'somewhere')}` : 'Untitled moment'); const place = typeof eventValue(event, ['place'], '') === 'object' ? first(eventValue(event, ['place'], {}), ['name'], '') : eventValue(event, ['place', 'placeName'], ''); return <article key={`${id}-${index}`} className="group relative flex gap-4 py-4 sm:gap-5 animate-rise" style={{ animationDelay: `${Math.min(index * 45, 300)}ms` }} data-testid={`card-event-${id}`}><time className="w-11 shrink-0 pt-1 text-right font-mono text-[10px] text-[hsl(var(--muted-foreground))] sm:w-[62px]">{String(time).slice(0, 5)}</time><span className={`relative z-10 mt-1.5 grid h-3 w-3 shrink-0 place-items-center rounded-full border-2 ${automatic ? 'border-[hsl(var(--accent))] bg-[hsl(var(--background))]' : 'border-[hsl(var(--primary))] bg-[hsl(var(--primary))]'}`} /><div className={`min-w-0 flex-1 rounded-xl border p-4 transition group-hover:-translate-y-0.5 ${automatic ? 'border-[hsl(var(--accent)/.3)] bg-[hsl(var(--accent)/.045)]' : 'border-[hsl(var(--border))] bg-[hsl(var(--card))]'}`}><div className="flex items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{title}</h3>{automatic && <span className="rounded-full bg-[hsl(var(--accent)/.12)] px-2 py-0.5 font-mono text-[9px] uppercase tracking-wide text-[hsl(var(--accent))]">location</span>}</div>{eventValue(event, ['description', 'details', 'note'], '') && <p className="mt-1 text-sm leading-5 text-[hsl(var(--muted-foreground))]">{eventValue(event, ['description', 'details', 'note'], '')}</p>}</div><button onClick={() => onDelete(id)} aria-label={`Delete ${title}`} className="rounded p-1.5 text-[hsl(var(--muted-foreground)/.65)] opacity-0 transition group-hover:opacity-100 hover:bg-[hsl(var(--destructive)/.1)] hover:text-[hsl(var(--destructive))]" data-testid={`button-delete-event-${id}`}><Trash2 size={14} /></button></div><div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[10px] uppercase tracking-wide text-[hsl(var(--muted-foreground))]">{place && <span className="flex items-center gap-1"><MapPin size={11} />{place}</span>}{eventValue(event, ['category'], '') && <span>{eventValue(event, ['category'], '')}</span>}<span>{automatic ? 'Automatic' : 'Manual'}</span></div></div></article>; })}</div>;
}

function AddActivity({
  date,
  onClose,
  onCreated,
}: {
  date: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const { handleUnauthorized } = useAuth();

  const [form, setForm] = useState({
    title: '',
    description: '',
    time: '12:00',
    category: 'Personal',
  });

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event: FormEvent) => {
    event.preventDefault();

    if (!form.title.trim()) {
      return setError('Give this moment a name.');
    }

    const eventPayload = {
      eventType: 'ACTIVITY',
      title: form.title.trim(),
      description: form.description.trim(),
      timestamp: `${date}T${form.time}:00`,
      category: form.category.toUpperCase(),
      source: 'MANUAL',
    };

    setBusy(true);
    setError('');

    try {
      await createEvent(eventPayload, handleUnauthorized);

      onCreated();
      onClose();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Could not save this moment.',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[hsl(var(--primary)/.32)] p-0 backdrop-blur-sm sm:items-center sm:p-5">
      <div className="w-full max-w-lg rounded-t-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-2xl sm:rounded-2xl animate-rise">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[.18em] text-[hsl(var(--accent))]">
              new memory
            </p>

            <h2 className="mt-1 font-display text-3xl">
              What happened?
            </h2>
          </div>

          <button
            onClick={onClose}
            aria-label="Close add activity"
            data-testid="button-close-add-activity"
          >
            <X size={19} />
          </button>
        </div>

        <form onSubmit={submit} className="mt-7 space-y-4">
          <Field
            label="Title"
            placeholder="A walk by the river"
            value={form.title}
            onChange={(event) =>
              setForm({
                ...form,
                title: event.target.value,
              })
            }
            data-testid="input-activity-title"
            autoFocus
          />

          <div className="grid grid-cols-2 gap-4">
            <Field
              label="Time"
              type="time"
              value={form.time}
              onChange={(event) =>
                setForm({
                  ...form,
                  time: event.target.value,
                })
              }
              data-testid="input-activity-time"
            />

            <label className="block space-y-1.5">
              <span className="text-xs font-semibold tracking-wide text-[hsl(var(--muted-foreground))]">
                Category
              </span>

              <select
                value={form.category}
                onChange={(event) =>
                  setForm({
                    ...form,
                    category: event.target.value,
                  })
                }
                className="w-full rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--card))] px-3.5 py-3 text-sm outline-none focus:border-[hsl(var(--accent))]"
                data-testid="select-activity-category"
              >
                <option>Personal</option>
                <option>Work</option>
                <option>Health</option>
                <option>Travel</option>
                <option>Food</option>
              </select>
            </label>
          </div>

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold tracking-wide text-[hsl(var(--muted-foreground))]">
              A little more{' '}
              <span className="font-normal">(optional)</span>
            </span>

            <textarea
              value={form.description}
              onChange={(event) =>
                setForm({
                  ...form,
                  description: event.target.value,
                })
              }
              rows={3}
              placeholder="Anything you want to remember about it…"
              className="w-full resize-none rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--card))] px-3.5 py-3 text-sm outline-none focus:border-[hsl(var(--accent))]"
              data-testid="textarea-activity-description"
            />
          </label>

          {error && (
            <p className="text-sm text-[hsl(var(--destructive))]">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="quiet"
              onClick={onClose}
              data-testid="button-cancel-add-activity"
            >
              Not now
            </Button>

            <Button
              type="submit"
              disabled={busy}
              data-testid="button-save-activity"
            >
              {busy ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Plus size={16} />
              )}
              Save moment
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AISection({ date }: { date: string }) {
  const { handleUnauthorized } = useAuth(); const [explain, setExplain] = useState<any>(null); const [askOpen, setAskOpen] = useState(false); const [question, setQuestion] = useState(''); const [answer, setAnswer] = useState(''); const [busy, setBusy] = useState<'explain' | 'ask' | ''>(''); const [error, setError] = useState('');
  const runExplain = async () => { setBusy('explain'); setError(''); try { setExplain(await explainDay(date, handleUnauthorized)); } catch (err) { setError(err instanceof ApiError ? err.message : 'Could not look through this day.'); } finally { setBusy(''); } };
  const runAsk = async () => { if (!question.trim()) return; setBusy('ask'); setError(''); try { const result = await askDay(date, question, handleUnauthorized); setAnswer(result?.answer || ''); } catch (err) { setError(err instanceof ApiError ? err.message : 'Could not search your recorded events.'); } finally { setBusy(''); } };
  return <section className="mt-12 grid gap-4 lg:grid-cols-[1.1fr_.9fr]"><div className="rounded-2xl bg-[hsl(var(--primary))] p-6 text-[hsl(var(--primary-foreground))] sm:p-7"><div className="flex items-start justify-between"><div><span className="grid h-9 w-9 place-items-center rounded-full bg-[hsl(var(--sidebar-primary)/.18)] text-[hsl(var(--sidebar-primary))]"><Sparkles size={17} /></span><h2 className="mt-5 font-display text-3xl">Explain my day</h2><p className="mt-2 max-w-sm text-sm leading-6 text-[hsl(var(--primary-foreground)/.65)]">Let the recorded moments show you the shape of {date === today() ? 'today' : prettyDate(date)}.</p></div><span className="font-mono text-[10px] uppercase tracking-[.18em] text-[hsl(var(--primary-foreground)/.38)]">AI / 01</span></div><Button onClick={runExplain} disabled={busy === 'explain'} className="mt-6 bg-[hsl(var(--sidebar-primary))] text-[hsl(var(--sidebar-primary-foreground))]" data-testid="button-explain-day">{busy === 'explain' ? <><Loader2 size={15} className="animate-spin" />Looking through your recorded day…</> : 'Read the day back to me'}</Button></div><div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 sm:p-7"><span className="grid h-9 w-9 place-items-center rounded-full bg-[hsl(var(--accent)/.12)] text-[hsl(var(--accent))]"><MessageCircle size={17} /></span><h2 className="mt-5 font-display text-3xl">Ask your day</h2><p className="mt-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">Search only what you recorded. Nothing is guessed.</p><Button variant="outline" onClick={() => setAskOpen(true)} className="mt-6" data-testid="button-open-ask-day"><Search size={15} />Ask a question</Button></div>
    {error && <p className="lg:col-span-2 text-sm text-[hsl(var(--destructive))]">{error}</p>}
    {explain && <div className="lg:col-span-2 rounded-2xl border border-[hsl(var(--accent)/.25)] bg-[hsl(var(--accent)/.06)] p-6 animate-rise" data-testid="panel-explanation"><div className="flex items-start justify-between gap-4"><div><p className="font-mono text-[10px] uppercase tracking-[.18em] text-[hsl(var(--accent))]">your day, reflected</p><p className="mt-3 font-display text-2xl leading-snug">{explain.summary || 'No summary was returned for this day.'}</p></div><button onClick={() => setExplain(null)} aria-label="Close explanation" data-testid="button-close-explanation"><X size={17} /></button></div>{Array.isArray(explain.highlights) && explain.highlights.length > 0 && <div className="mt-5 border-t border-[hsl(var(--accent)/.18)] pt-4"><p className="text-xs font-semibold uppercase tracking-wide text-[hsl(var(--muted-foreground))]">Highlights</p><ul className="mt-2 space-y-1 text-sm">{explain.highlights.map((item: any, i: number) => <li key={i} className="flex gap-2"><span className="text-[hsl(var(--accent))]">—</span>{typeof item === 'string' ? item : JSON.stringify(item)}</li>)}</ul></div>}</div>}
    {askOpen && <div className="lg:col-span-2 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 animate-rise"><div className="flex justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[.18em] text-[hsl(var(--accent))]">search your recorded events</p><h3 className="mt-2 font-display text-2xl">What are you trying to find?</h3></div><button onClick={() => setAskOpen(false)} aria-label="Close ask day" data-testid="button-close-ask-day"><X size={17} /></button></div><div className="mt-4 flex flex-col gap-3 sm:flex-row"><input value={question} onChange={e => setQuestion(e.target.value)} onKeyDown={e => e.key === 'Enter' && runAsk()} placeholder="I lost something. Where was I after 2 PM?" className="min-w-0 flex-1 rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3.5 py-3 text-sm outline-none focus:border-[hsl(var(--accent))]" data-testid="input-day-question" /><Button onClick={runAsk} disabled={busy === 'ask'} data-testid="button-ask-day">{busy === 'ask' ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}Search day</Button></div><div className="mt-3 flex flex-wrap gap-2"><button onClick={() => setQuestion('I lost something. Where was I after 2 PM?')} className="rounded-full border border-[hsl(var(--border))] px-3 py-1.5 text-xs text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--accent))]" data-testid="button-suggestion-lost-item">I lost something. Where was I after 2 PM?</button><button onClick={() => setQuestion('What places did I visit?')} className="rounded-full border border-[hsl(var(--border))] px-3 py-1.5 text-xs text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--accent))]" data-testid="button-suggestion-places">What places did I visit?</button></div>{answer && <div className="mt-5 rounded-xl bg-[hsl(var(--muted))] p-4 text-sm leading-6" data-testid="text-day-answer">{answer}</div>}</div>}
  </section>;
}

function TodayPage({ timelineOnly = false }: { timelineOnly?: boolean }) {
  const { handleUnauthorized } = useAuth(); const [date, setDate] = useState(today()); const [events, setEvents] = useState<any[]>([]); const [busy, setBusy] = useState(true); const [error, setError] = useState(''); const [showAdd, setShowAdd] = useState(false);
  const load = async () => { setBusy(true); setError(''); try { const result = await getEvents(date, handleUnauthorized); setEvents(Array.isArray(result) ? result : []); } catch (err) { setError(err instanceof ApiError ? err.message : 'Could not load this day.'); } finally { setBusy(false); } };
  useEffect(() => { load(); const refresh = () => load(); window.addEventListener('daylog:refresh', refresh); return () => window.removeEventListener('daylog:refresh', refresh); }, [date]);
  const remove = async (id: string | number) => { if (!window.confirm('Remove this moment from your daylog?')) return; try { await deleteEvent(id, handleUnauthorized); setEvents(current => current.filter(event => first(event, ['id', 'eventId']) !== id)); } catch (err) { setError(err instanceof ApiError ? err.message : 'Could not remove that moment.'); } };
  const title = timelineOnly ? 'Timeline' : date === today() ? 'Today' : prettyDate(date);
  return <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-12 lg:px-12"><header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[.22em] text-[hsl(var(--accent))]">{timelineOnly ? 'the long view' : 'your quiet record'}</p><h1 className="mt-2 font-display text-5xl tracking-tight sm:text-6xl">{title}</h1><p className="mt-3 max-w-md text-sm text-[hsl(var(--muted-foreground))]">{timelineOnly ? 'Move through the days you have kept, one thread at a time.' : 'A place to gather what happened, before it drifts away.'}</p></div><div className="flex items-center gap-2"><DateNav date={date} setDate={setDate} />{!timelineOnly && <Button onClick={() => setShowAdd(true)} data-testid="button-open-add-activity"><Plus size={16} />Add activity</Button>}</div></header><div className="mt-12 flex items-center justify-between border-b border-[hsl(var(--border))] pb-3"><div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[hsl(var(--accent))]" /><span className="font-mono text-[10px] uppercase tracking-[.18em] text-[hsl(var(--muted-foreground))]">{busy ? 'finding moments…' : `${events.length} ${events.length === 1 ? 'moment' : 'moments'} recorded`}</span></div>{error && <button onClick={load} className="text-xs font-semibold text-[hsl(var(--accent))] hover:underline" data-testid="button-retry-events">Try again</button>}</div>{error && <div className="mt-5 rounded-xl border border-[hsl(var(--destructive)/.25)] bg-[hsl(var(--destructive)/.06)] px-4 py-3 text-sm text-[hsl(var(--destructive))]" role="alert">{error}</div>}<div className="mt-3"><Timeline events={events} busy={busy} onDelete={remove} /></div>{!timelineOnly && <AISection date={date} />}{showAdd && <AddActivity date={date} onClose={() => setShowAdd(false)} onCreated={load} />}</div>;
}

function PlacesPage() {
  const { handleUnauthorized } = useAuth(); const [places, setPlaces] = useState<any[]>([]); const [busy, setBusy] = useState(true); const [error, setError] = useState(''); const [form, setForm] = useState({ name: '', latitude: '', longitude: '', radius: '100' }); const [saving, setSaving] = useState(false); const [simBusy, setSimBusy] = useState(''); const load = async () => { setBusy(true); try { const result = await getPlaces(handleUnauthorized); setPlaces(Array.isArray(result) ? result : []); } catch (err) { setError(err instanceof ApiError ? err.message : 'Could not load your places.'); } finally { setBusy(false); } }; useEffect(() => { load(); }, []);
  const add = async (e: FormEvent) => { e.preventDefault(); if (!form.name || !form.latitude || !form.longitude) return setError('Give the place a name and coordinates.'); setSaving(true); setError(''); try { const place = await createPlace({ name: form.name, latitude: Number(form.latitude), longitude: Number(form.longitude), radius: Number(form.radius) }, handleUnauthorized); setPlaces(prev => [...prev, place]); setForm({ name: '', latitude: '', longitude: '', radius: '100' }); } catch (err) { setError(err instanceof ApiError ? err.message : 'Could not save this place.'); } finally { setSaving(false); } };
  const remove = async (id: string | number) => { if (!window.confirm('Remove this saved place?')) return; try { await deletePlace(id, handleUnauthorized); setPlaces(prev => prev.filter(place => first(place, ['id', 'placeId']) !== id)); } catch (err) { setError(err instanceof ApiError ? err.message : 'Could not remove this place.'); } };
  const simulate = async (placeId: string | number, action: 'ARRIVE' | 'LEAVE') => { setSimBusy(`${placeId}-${action}`); try { await demoLocation({ placeId, action }, handleUnauthorized); window.dispatchEvent(new Event('daylog:refresh')); } catch (err) { setError(err instanceof ApiError ? err.message : 'The demo event could not be recorded.'); } finally { setSimBusy(''); } };
  return <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-12 lg:px-12"><header><p className="font-mono text-[10px] uppercase tracking-[.22em] text-[hsl(var(--accent))]">where you were</p><h1 className="mt-2 font-display text-5xl tracking-tight sm:text-6xl">Places</h1><p className="mt-3 max-w-md text-sm text-[hsl(var(--muted-foreground))]">Save the places that make a day recognizable. Coordinates stay in the technical details.</p></header><div className="mt-12 grid gap-10 lg:grid-cols-[1.2fr_.8fr]"><section><div className="flex items-center justify-between border-b border-[hsl(var(--border))] pb-3"><span className="font-mono text-[10px] uppercase tracking-[.18em] text-[hsl(var(--muted-foreground))]">saved places</span><span className="text-xs text-[hsl(var(--muted-foreground))]">{places.length} saved</span></div>{error && <p className="mt-4 text-sm text-[hsl(var(--destructive))]">{error}</p>}{busy ? <div className="mt-4 space-y-3">{[1, 2].map(i => <div key={i} className="h-24 animate-soft-pulse rounded-xl bg-[hsl(var(--muted))]" />)}</div> : !places.length ? <div className="mt-4 rounded-xl border border-dashed border-[hsl(var(--border))] p-8 text-center"><MapPin className="mx-auto text-[hsl(var(--accent))]" /><p className="mt-3 font-display text-xl">No familiar places yet.</p><p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">Add one on the right to start recognizing your days.</p></div> : <div className="mt-3 space-y-3">{places.map((place, i) => { const id = first(place, ['id', 'placeId'], i); return <div key={id} className="group rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 transition hover:border-[hsl(var(--accent)/.5)]" data-testid={`card-place-${id}`}><div className="flex items-start justify-between"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-[hsl(var(--accent)/.12)] text-[hsl(var(--accent))]"><MapPin size={16} /></span><div><h3 className="font-semibold">{first(place, ['name'], 'Unnamed place')}</h3><p className="mt-1 font-mono text-[10px] text-[hsl(var(--muted-foreground))]">{first(place, ['radius'], '—')}m radius · {first(place, ['latitude', 'lat'], '—')}, {first(place, ['longitude', 'lng', 'lon'], '—')}</p></div></div><button onClick={() => remove(id)} aria-label="Delete place" className="p-2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--destructive))]" data-testid={`button-delete-place-${id}`}><Trash2 size={15} /></button></div><div className="mt-4 flex items-center gap-2 border-t border-[hsl(var(--border)/.7)] pt-3"><span className="font-mono text-[9px] uppercase tracking-wide text-[hsl(var(--muted-foreground))]">demo controls</span><Button variant="quiet" className="ml-auto px-2.5 py-1.5 text-xs" disabled={!!simBusy} onClick={() => simulate(id, 'ARRIVE')} data-testid={`button-demo-arrive-${id}`}>Arrive</Button><Button variant="quiet" className="px-2.5 py-1.5 text-xs" disabled={!!simBusy} onClick={() => simulate(id, 'LEAVE')} data-testid={`button-demo-leave-${id}`}>Leave</Button></div></div>; })}</div>}</section><section className="h-fit rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"><Plus size={17} /></span><div><h2 className="font-display text-2xl">Add a place</h2><p className="text-xs text-[hsl(var(--muted-foreground))]">For location event matching</p></div></div><form onSubmit={add} className="mt-6 space-y-4"><Field label="Place name" placeholder="Home, the studio, a favorite café" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} data-testid="input-place-name" /><div className="grid grid-cols-2 gap-3"><Field label="Latitude" type="number" step="any" placeholder="40.7128" value={form.latitude} onChange={e => setForm({ ...form, latitude: e.target.value })} data-testid="input-place-latitude" /><Field label="Longitude" type="number" step="any" placeholder="-74.0060" value={form.longitude} onChange={e => setForm({ ...form, longitude: e.target.value })} data-testid="input-place-longitude" /></div><Field label="Radius (meters)" type="number" min="1" value={form.radius} onChange={e => setForm({ ...form, radius: e.target.value })} data-testid="input-place-radius" /><Button type="submit" className="w-full" disabled={saving} data-testid="button-save-place">{saving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}Save place</Button></form><p className="mt-4 text-[11px] leading-5 text-[hsl(var(--muted-foreground))]">Demo controls create recorded location events for testing. They do not access your device location.</p></section></div></div>;
}

function SettingsPage() {
  const { user, signOut } = useAuth(); return <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8 sm:py-12 lg:px-12"><p className="font-mono text-[10px] uppercase tracking-[.22em] text-[hsl(var(--accent))]">your space</p><h1 className="mt-2 font-display text-5xl tracking-tight">Settings</h1><p className="mt-3 text-sm text-[hsl(var(--muted-foreground))]">A few quiet details about your DayLog.</p><div className="mt-12 space-y-4"><section className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 sm:p-7"><div className="flex items-center gap-4"><span className="grid h-14 w-14 place-items-center rounded-full bg-[hsl(var(--accent)/.13)] font-display text-2xl text-[hsl(var(--accent))]">{(user?.name || user?.email || 'D').slice(0, 1).toUpperCase()}</span><div><p className="font-display text-2xl">{user?.name || 'Your account'}</p><p className="text-sm text-[hsl(var(--muted-foreground))]">{user?.email || 'Signed in to DayLog'}</p></div></div></section><section className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 sm:p-7"><div className="flex gap-4"><span className="mt-1 text-[hsl(var(--accent))]"><FileText size={18} /></span><div><h2 className="font-semibold">Your privacy, in plain words</h2><p className="mt-2 max-w-xl text-sm leading-6 text-[hsl(var(--muted-foreground))]">DayLog is a personal record. Your activities, places, and questions are sent to your DayLog account so the service can return them to you. We do not turn your day into a feed, a score, or a story for anyone else.</p></div></div></section><section className="flex flex-col gap-4 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7"><div><h2 className="font-semibold">Leave DayLog</h2><p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">Sign out on this device.</p></div><Button variant="danger" onClick={signOut} data-testid="button-logout-settings"><LogOut size={15} />Log out</Button></section></div></div>;
}

function Protected({ children }: { children: ReactNode }) { const { token } = useAuth(); const [, setLocation] = useLocation(); useEffect(() => { if (!token) setLocation('/login'); }, [token, setLocation]); return token ? <Shell>{children}</Shell> : null; }
function Router() { return <ErrorBoundary><Switch><Route path="/login"><AuthPage mode="login" /></Route><Route path="/register"><AuthPage mode="register" /></Route><Route path="/"><Protected><TodayPage /></Protected></Route><Route path="/timeline"><Protected><TodayPage timelineOnly /></Protected></Route><Route path="/places"><Protected><PlacesPage /></Protected></Route><Route path="/settings"><Protected><SettingsPage /></Protected></Route><Route component={NotFound} /></Switch></ErrorBoundary>; }
function App() { return <QueryClientProvider client={queryClient}><TooltipProvider><AuthProvider><Router /></AuthProvider><Toaster /></TooltipProvider></QueryClientProvider>; }
export default App;