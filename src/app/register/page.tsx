"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Paroles nesakrīt');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Store token and user data
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="text-center space-y-2">
          <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <div className="w-6 h-6 bg-blue-600 rounded"></div>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Reģistrēties</CardTitle>
          <CardDescription>
            Izveidojiet kontu, lai sāktu izmantot dokumentu sistēmu
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="username">Lietotājvārds</Label>
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="Izvēlieties lietotājvārdu"
                value={formData.username}
                onChange={handleChange}
                required
                disabled={loading}
                minLength={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-pasta adrese</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="jūsu@epasts.lv"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Parole</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Izvēlieties paroli"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={loading}
                minLength={6}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Apstiprināt paroli</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Ievadiet paroli vēlreiz"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                disabled={loading}
                minLength={6}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Reģistrējas...' : 'Reģistrēties'}
            </Button>

            <div className="text-center text-sm text-gray-600 dark:text-gray-300">
              Jau ir konts?{' '}
              <Link 
                href="/login" 
                className="text-blue-600 hover:text-blue-500 font-medium"
              >
                Pieslēgties
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}