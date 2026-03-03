'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { User, Bell, Palette, Shield, Save, Check, Moon, Sun, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'grepr-settings';

interface Settings {
  profile: {
    name: string;
    email: string;
  };
  notifications: {
    emailNotifications: boolean;
    weeklyDigest: boolean;
    newPostAlerts: boolean;
  };
}

const defaultSettings: Settings = {
  profile: {
    name: '',
    email: '',
  },
  notifications: {
    emailNotifications: true,
    weeklyDigest: true,
    newPostAlerts: false,
  },
};

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  // Load settings from localStorage on mount
  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSettings({ ...defaultSettings, ...parsed });
      } catch (e) {
        console.error('Failed to parse settings:', e);
      }
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const updateProfile = (field: keyof Settings['profile'], value: string) => {
    setSettings(prev => ({
      ...prev,
      profile: { ...prev.profile, [field]: value }
    }));
  };

  const toggleNotification = (field: keyof Settings['notifications']) => {
    setSettings(prev => ({
      ...prev,
      notifications: { ...prev.notifications, [field]: !prev.notifications[field] }
    }));
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <main className="min-h-screen bg-background pt-20">
        <div className="max-w-3xl mx-auto p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-48 mb-4"></div>
            <div className="h-4 bg-muted rounded w-64 mb-8"></div>
            <div className="h-64 bg-muted rounded mb-6"></div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background pt-20">
      <div className="max-w-3xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2 font-sans">Paramètres</h1>
          <p className="text-muted-foreground font-sans text-sm">Gérez votre compte et vos préférences</p>
        </div>

        {/* Profile Section */}
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-primary/10">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold">Profil</h2>
              <p className="text-sm text-muted-foreground">Informations personnelles</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary-foreground">
                  {settings.profile.name ? settings.profile.name.charAt(0).toUpperCase() : '?'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Nom</label>
                <Input
                  value={settings.profile.name}
                  onChange={(e) => updateProfile('name', e.target.value)}
                  placeholder="Votre nom"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Email</label>
                <Input
                  type="email"
                  value={settings.profile.email}
                  onChange={(e) => updateProfile('email', e.target.value)}
                  placeholder="votre@email.com"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Notifications Section */}
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Bell className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <h2 className="font-semibold">Notifications</h2>
              <p className="text-sm text-muted-foreground">Préférences de notification</p>
            </div>
          </div>

          <div className="space-y-4">
            {[
              { key: 'emailNotifications' as const, label: 'Notifications par email', desc: 'Recevoir les mises à jour importantes' },
              { key: 'weeklyDigest' as const, label: 'Résumé hebdomadaire', desc: 'Digest des meilleurs posts de la semaine' },
              { key: 'newPostAlerts' as const, label: 'Alertes nouveaux posts', desc: 'Notification pour chaque nouveau post' },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-sm">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <button
                  onClick={() => toggleNotification(item.key)}
                  className={cn(
                    'w-11 h-6 rounded-full transition-colors relative',
                    settings.notifications[item.key] ? 'bg-primary' : 'bg-muted'
                  )}
                >
                  <div
                    className={cn(
                      'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform',
                      settings.notifications[item.key] ? 'translate-x-6' : 'translate-x-1'
                    )}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Appearance Section */}
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Palette className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <h2 className="font-semibold">Apparence</h2>
              <p className="text-sm text-muted-foreground">Personnalisez l'interface</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="font-medium text-sm mb-3">Thème</p>
              <div className="flex gap-3">
                {[
                  { value: 'light', label: 'Clair', icon: Sun },
                  { value: 'dark', label: 'Sombre', icon: Moon },
                  { value: 'system', label: 'Système', icon: Monitor },
                ].map((t) => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.value}
                      onClick={() => setTheme(t.value)}
                      className={cn(
                        'flex items-center gap-2 px-4 py-2 rounded-md border transition-colors text-sm',
                        theme === t.value
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:border-primary/50'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Data Section */}
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Shield className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <h2 className="font-semibold">Données</h2>
              <p className="text-sm text-muted-foreground">Gestion des données locales</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Réinitialiser les paramètres</p>
                <p className="text-xs text-muted-foreground">Revenir aux paramètres par défaut</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  localStorage.removeItem(STORAGE_KEY);
                  setSettings(defaultSettings);
                }}
              >
                Réinitialiser
              </Button>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} className="gap-2">
            {saved ? (
              <>
                <Check className="h-4 w-4" />
                Enregistré!
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Enregistrer
              </>
            )}
          </Button>
        </div>
      </div>
    </main>
  );
}
