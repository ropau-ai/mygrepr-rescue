'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { User, Bell, Palette, Shield, Save, Check, Moon, Sun, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'grepr-settings';

interface Settings {
  profile: { name: string; email: string };
  notifications: {
    emailNotifications: boolean;
    weeklyDigest: boolean;
    newPostAlerts: boolean;
  };
}

const defaultSettings: Settings = {
  profile: { name: '', email: '' },
  notifications: { emailNotifications: true, weeklyDigest: true, newPostAlerts: false },
};

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try { setSettings({ ...defaultSettings, ...JSON.parse(stored) }); } catch {}
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const updateProfile = (field: keyof Settings['profile'], value: string) => {
    setSettings(prev => ({ ...prev, profile: { ...prev.profile, [field]: value } }));
  };

  const toggleNotification = (field: keyof Settings['notifications']) => {
    setSettings(prev => ({ ...prev, notifications: { ...prev.notifications, [field]: !prev.notifications[field] } }));
  };

  if (!mounted) {
    return (
      <main className="min-h-screen bg-background pt-20">
        <div className="max-w-2xl mx-auto px-6">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-48 mb-4" />
            <div className="h-4 bg-muted rounded w-64 mb-8" />
            <div className="h-64 bg-muted rounded" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background pt-16 pb-16">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'var(--font-serif), serif' }}>
            Parametres
          </h1>
          <p className="text-xs text-muted-foreground">Gerez votre compte et vos preferences</p>
        </div>

        {/* Profile */}
        <div className="bg-card border border-border rounded-lg p-6 mb-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 rounded-lg bg-muted">
              <User className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-sm font-bold" style={{ fontFamily: 'var(--font-serif), serif' }}>Profil</h2>
              <p className="text-[11px] text-muted-foreground">Informations personnelles</p>
            </div>
          </div>

          <div className="flex items-center gap-4 mb-5">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
              <span className="text-xl font-bold text-muted-foreground">
                {settings.profile.name ? settings.profile.name.charAt(0).toUpperCase() : '?'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium mb-1.5 block">Nom</label>
              <input
                value={settings.profile.name}
                onChange={(e) => updateProfile('name', e.target.value)}
                placeholder="Votre nom"
                className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm placeholder:text-muted-foreground"
              />
            </div>
            <div>
              <label className="text-xs font-medium mb-1.5 block">Email</label>
              <input
                type="email"
                value={settings.profile.email}
                onChange={(e) => updateProfile('email', e.target.value)}
                placeholder="votre@email.com"
                className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm placeholder:text-muted-foreground"
              />
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-card border border-border rounded-lg p-6 mb-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 rounded-lg bg-muted">
              <Bell className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-sm font-bold" style={{ fontFamily: 'var(--font-serif), serif' }}>Notifications</h2>
              <p className="text-[11px] text-muted-foreground">Preferences de notification</p>
            </div>
          </div>

          <div className="space-y-4">
            {[
              { key: 'emailNotifications' as const, label: 'Notifications par email', desc: 'Recevoir les mises a jour importantes' },
              { key: 'weeklyDigest' as const, label: 'Resume hebdomadaire', desc: 'Digest des meilleurs posts de la semaine' },
              { key: 'newPostAlerts' as const, label: 'Alertes nouveaux posts', desc: 'Notification pour chaque nouveau post' },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between py-1">
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                </div>
                <button
                  onClick={() => toggleNotification(item.key)}
                  className={cn(
                    'w-10 h-5 rounded-full transition-colors relative',
                    settings.notifications[item.key] ? 'bg-foreground' : 'bg-muted'
                  )}
                >
                  <div className={cn(
                    'absolute top-0.5 w-4 h-4 rounded-full bg-background transition-transform',
                    settings.notifications[item.key] ? 'translate-x-5' : 'translate-x-0.5'
                  )} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Appearance */}
        <div className="bg-card border border-border rounded-lg p-6 mb-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 rounded-lg bg-muted">
              <Palette className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-sm font-bold" style={{ fontFamily: 'var(--font-serif), serif' }}>Apparence</h2>
              <p className="text-[11px] text-muted-foreground">Personnalisez l'interface</p>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium mb-2">Theme</p>
            <div className="flex gap-2">
              {[
                { value: 'light', label: 'Clair', icon: Sun },
                { value: 'dark', label: 'Sombre', icon: Moon },
                { value: 'system', label: 'Systeme', icon: Monitor },
              ].map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.value}
                    onClick={() => setTheme(t.value)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-md border transition-colors text-xs',
                      theme === t.value
                        ? 'border-foreground bg-foreground/5 text-foreground'
                        : 'border-border text-muted-foreground hover:border-foreground/30'
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Data */}
        <div className="bg-card border border-border rounded-lg p-6 mb-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 rounded-lg bg-muted">
              <Shield className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-sm font-bold" style={{ fontFamily: 'var(--font-serif), serif' }}>Donnees</h2>
              <p className="text-[11px] text-muted-foreground">Gestion des donnees locales</p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Reinitialiser les parametres</p>
              <p className="text-[11px] text-muted-foreground">Revenir aux parametres par defaut</p>
            </div>
            <button
              onClick={() => { localStorage.removeItem(STORAGE_KEY); setSettings(defaultSettings); }}
              className="px-3 py-1.5 rounded-md border border-border text-xs text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
            >
              Reinitialiser
            </button>
          </div>
        </div>

        {/* Save */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-foreground text-background text-xs font-medium hover:bg-foreground/90 transition-colors"
          >
            {saved ? <><Check className="h-3.5 w-3.5" /> Enregistre!</> : <><Save className="h-3.5 w-3.5" /> Enregistrer</>}
          </button>
        </div>
      </div>
    </main>
  );
}
