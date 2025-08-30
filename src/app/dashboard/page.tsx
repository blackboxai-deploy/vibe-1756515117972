"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  created_at: string;
  documents_count: number;
}

interface Stats {
  total_documents: number;
  total_size: number;
  total_size_formatted: string;
  total_users: number;
  total_categories: number;
}

interface Document {
  id: number;
  title: string;
  filename: string;
  file_size_formatted: string;
  file_type: string;
  upload_date: string;
  category?: {
    name: string;
    color: string;
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentDocuments, setRecentDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const userData = localStorage.getItem('user');

    if (!token) {
      router.push('/login');
      return;
    }

    if (userData) {
      setUser(JSON.parse(userData));
    }

    fetchDashboardData(token);
  }, [router]);

  const fetchDashboardData = async (token: string) => {
    try {
      // Fetch stats
      const statsResponse = await fetch('http://localhost:5000/api/documents/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      // Fetch recent documents
      const docsResponse = await fetch('http://localhost:5000/api/documents?per_page=5', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (docsResponse.ok) {
        const docsData = await docsResponse.json();
        setRecentDocuments(docsData.documents);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    router.push('/');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('lv-LV', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Ielādē datus...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <div className="w-6 h-6 bg-white rounded"></div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Pārvaldības panelis
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Laipni lūgti, {user?.username}!
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant={user?.role === 'admin' ? 'destructive' : 'secondary'}>
              {user?.role === 'admin' ? 'Administrators' : 'Lietotājs'}
            </Badge>
            <Button 
              variant="outline" 
              onClick={() => router.push('/documents')}
            >
              Dokumenti
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              Iziet
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Kopā dokumenti</CardTitle>
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <div className="w-4 h-4 bg-blue-600 rounded"></div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_documents || 0}</div>
              <p className="text-xs text-muted-foreground">dokumenti sistēmā</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Izmantotā vieta</CardTitle>
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <div className="w-4 h-4 bg-green-600 rounded"></div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_size_formatted || '0 B'}</div>
              <p className="text-xs text-muted-foreground">failu izmērs</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Kategorijas</CardTitle>
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <div className="w-4 h-4 bg-purple-600 rounded"></div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_categories || 0}</div>
              <p className="text-xs text-muted-foreground">aktīvas kategorijas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lietotāji</CardTitle>
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <div className="w-4 h-4 bg-orange-600 rounded"></div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_users || 0}</div>
              <p className="text-xs text-muted-foreground">reģistrēti lietotāji</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Ātras darbības</CardTitle>
            <CardDescription>
              Biežāk izmantotās funkcijas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button onClick={() => router.push('/documents')}>
                Skatīt dokumentus
              </Button>
              <Button variant="outline" onClick={() => router.push('/documents?action=upload')}>
                Augšupielādēt dokumentu
              </Button>
              {user?.role === 'admin' && (
                <Button variant="outline" onClick={() => router.push('/categories')}>
                  Pārvaldīt kategorijas
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Documents */}
        <Card>
          <CardHeader>
            <CardTitle>Nesen pievienotie dokumenti</CardTitle>
            <CardDescription>
              Jūsu pēdējie augšupielādētie dokumenti
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentDocuments.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p>Nav augšupielādētu dokumentu</p>
                <Button 
                  className="mt-4"
                  onClick={() => router.push('/documents?action=upload')}
                >
                  Augšupielādēt pirmo dokumentu
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentDocuments.map((doc, index) => (
                  <div key={doc.id}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                            {doc.file_type.toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {doc.title}
                          </h4>
                          <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <span>{doc.filename}</span>
                            <span>•</span>
                            <span>{doc.file_size_formatted}</span>
                            <span>•</span>
                            <span>{formatDate(doc.upload_date)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {doc.category && (
                          <Badge 
                            style={{ backgroundColor: doc.category.color }}
                            className="text-white"
                          >
                            {doc.category.name}
                          </Badge>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => router.push(`/documents?id=${doc.id}`)}
                        >
                          Skatīt
                        </Button>
                      </div>
                    </div>
                    {index < recentDocuments.length - 1 && <Separator className="mt-4" />}
                  </div>
                ))}
                
                {recentDocuments.length === 5 && (
                  <div className="pt-4 text-center">
                    <Button 
                      variant="outline" 
                      onClick={() => router.push('/documents')}
                    >
                      Skatīt visus dokumentus
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}