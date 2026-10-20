import { Link, useNavigate } from '@tanstack/react-router';
import { useState, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { ArrowRight, UserRound, BookOpen, CalendarDays, Headphones, Radio, HeartHandshake, Mail, Copy, Check, Instagram, Facebook, Youtube, Send, Settings, LogOut, Library, NotebookPen, HandCoins, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetDescription, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { MemberAuth } from './MemberAuth';
import { contentOptions, identityOptions } from '@/lib/content-query';
import { signOut } from '@/lib/auth.functions';
import logo from '@/assets/logo.asset.json';

export const ministryLinks = [
  { to: '/devotion', label: 'Daily devotion', icon: NotebookPen },
  { to: '/reading-plan', label: 'Bible reading plan', icon: CalendarDays },
  { to: '/sermons', label: 'The Word', icon: Headphones },
  { to: '/live', label: 'Live broadcast', icon: Radio },
  { to: '/prayer', label: 'Prayer Wall', icon: HeartHandshake },
  { to: '/bible', label: 'Bible', icon: BookOpen },
  { to: '/library', label: 'Library', icon: Library },
  { to: '/events', label: 'Events', icon: CalendarDays },
  { to: '/partnership', label: 'Partnership', icon: HandCoins },
] as const;

export function SocialLinks({ settings }: { settings: Record<string, string> }) {
  const socials = [
    { key: 'telegram', label: 'Telegram', icon: Send },
    { key: 'instagram', label: 'Instagram @basileiaminintl', icon: Instagram },
    { key: 'youtube', label: "YouTube Basileia Ministries Int'l", icon: Youtube },
    { key: 'facebook', label: 'Facebook', icon: Facebook },
    { key: 'x', label: 'X', icon: null },
    { key: 'email', label: 'Email', icon: Mail },
  ];
  return (
    <div className="social-icons">
      {socials.map(s => {
        const href = settings[s.key];
        const icon = s.icon ? <s.icon size={20} /> : <span className="font-bold">𝕏</span>;
        return href
          ? <a key={s.key} href={s.key === 'email' ? `mailto:${href}` : href} title={s.label} aria-label={s.label} target={s.key === 'email' ? undefined : '_blank'} rel="noreferrer">{icon}</a>
          : <span key={s.key} className="social-unavailable" aria-label={`${s.label} link not provided`} title={`${s.label} link not provided`}>{icon}</span>;
      })}
    </div>
  );
}

export function AccountCopy({ settings }: { settings: Record<string, string> }) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  return (
    <>
      <div className="account-copy">
        <span>{settings['bank_name']}</span>
        <strong>{settings['bank_account']}</strong>
        <span>{settings['bank_holder']}</span>
        <Button variant="ghost" size="icon" aria-label="Copy account number" title={copied ? 'Copied' : 'Copy account number'} onClick={async () => {
          try { await navigator.clipboard.writeText(settings['bank_account'] ?? ''); setCopied(true); setTimeout(() => setCopied(false), 2000); }
          catch { setError('Copy unavailable. Please select the account number.'); }
        }}>{copied ? <Check size={18} /> : <Copy size={18} />}</Button>
      </div>
      {error && <p role="status" className="status">{error}</p>}
    </>
  );
}

function Brand({ name }: { name: string }) {
  return <Link to="/" className="brand"><img src={logo.url} width={48} height={48} alt="BMI logo" /><span className="brand-name">{name}</span></Link>;
}

export function MinistryShell({ children }: { children: ReactNode }) {
  const [joining, setJoining] = useState(false);
  const { data: content } = useQuery(contentOptions);
  const { data: user } = useQuery(identityOptions);
  const settings = content?.settings ?? {};
  const name = settings['brand_name'] || 'Basileia Ministries International';
  const logout = useServerFn(signOut);
  const qc = useQueryClient();
  const navigate = useNavigate();
  return (
    <div className="site-shell">
      <header className="site-header">
        <div className="container-main header-inner">
          <Sheet>
            <SheetTrigger asChild><Button variant="ghost" size="icon" className="avatar-trigger" aria-label="Open profile and menu"><UserRound /></Button></SheetTrigger>
            <SheetContent side="left" className="drawer">
              <div className="profile-avatar"><UserRound size={30} /></div>
              <SheetTitle className="mt-5">{user?.name ?? 'Welcome to BMI'}</SheetTitle>
              <SheetDescription className="mt-2 break-all">{user?.email ?? name}</SheetDescription>
              {!user && <Button className="mt-5" onClick={() => setJoining(true)}>Sign in or join <ArrowRight /></Button>}
              <nav className="drawer-nav">
                <SheetClose asChild><Link to="/"><Home size={18} />Home</Link></SheetClose>
                {ministryLinks.map(item => <SheetClose asChild key={item.to}><Link to={item.to}><item.icon size={18} />{item.label}</Link></SheetClose>)}
                <SheetClose asChild><Link to={user?.kind === 'admin' ? '/admin' : '/admin/login'}><Settings size={18} />{user?.kind === 'admin' ? 'Studio' : 'Administrator sign-in'}</Link></SheetClose>
              </nav>
              {user && <Button className="mt-5" variant="outline" onClick={async () => { await qc.cancelQueries(); qc.clear(); await logout(); await navigate({ to: '/', replace: true }); }}><LogOut />Sign out</Button>}
            </SheetContent>
          </Sheet>
          <Brand name={name} />
          <nav className="desktop-nav" aria-label="Main">
            <Link to="/" activeProps={{ className: 'active' }} activeOptions={{ exact: true }}>Home</Link>
            <Link to="/devotion" activeProps={{ className: 'active' }}>Devotion</Link>
            <Link to="/sermons" activeProps={{ className: 'active' }}>The Word</Link>
            <Link to="/bible" activeProps={{ className: 'active' }}>Bible</Link>
            <Link to="/events" activeProps={{ className: 'active' }}>Events</Link>
            <Link to="/partnership" activeProps={{ className: 'active' }}>Partnership</Link>
          </nav>
          {user?.kind === 'admin'
            ? <Button className="header-join" size="sm" asChild><Link to="/admin">Studio</Link></Button>
            : user ? <Button className="header-join" size="sm" asChild><Link to="/bible">My Bible</Link></Button>
            : <Button className="header-join" size="sm" onClick={() => setJoining(true)}>Join us <ArrowRight /></Button>}
        </div>
      </header>
      <div className="site-main">{children}</div>
      <footer className="site-footer">
        <div className="container-main">
          <div className="footer-top">
            <div className="footer-brand"><Brand name={name} />{settings['footer_text'] && <p>{settings['footer_text']}</p>}</div>
            <div className="footer-mission">
              {settings['mission_title'] && <h2>{settings['mission_title']}</h2>}
              {settings['mission_body'] && <p>{settings['mission_body']}</p>}
            </div>
          </div>
          <div className="footer-bottom">
            <SocialLinks settings={settings} />
            <span>© {new Date().getUTCFullYear()} {name}. All rights reserved.</span>
          </div>
        </div>
      </footer>
      <Dialog open={joining} onOpenChange={setJoining}>
        <DialogContent className="signup-dialog">
          <DialogTitle>Join the BMI family</DialogTitle>
          <DialogDescription>{name}</DialogDescription>
          <MemberAuth onDone={() => setJoining(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function PageTitle(_props: { title: string; description: string; kicker?: string }) { return null; }
export function MemberNotice({ intro }: { intro?: string }) { return <div className="member-notice"><MemberAuth intro={intro} /></div>; }
