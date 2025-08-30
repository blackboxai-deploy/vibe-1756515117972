"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Category {
  id: number;
  name: string;
  description?: string;
  color: string;
  documents_count: number;
  created_at: string;
}

interface User {
  role: string;
}

export default function CategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    color: '#3b82f6'
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [submitLoading, setSubmitLoading] = useState(false);

  const colorOptions = [
    { value: '#3b82f6', name: 'Zila' },
    { value: '#ef4444', name: 'Sarkana' },
    { value: '#10b981', name: 'Zaļa' },
    { value: '#f59e0b', name: 'Dzeltena' },
    { value: '#8b5cf6', name: 'Violeta' },
    { value: '#f97316', name: 'Oranža' },
    { value: '#06b6d4', name: 'Ciāna' },
    { value: '#84cc16', name: 'Laima' },
    { value: '#ec4899', name: 'Rozā' },
    { value: '#6b7280', name: 'Pelēka' }
  ];

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const userData = localStorage.getItem('user');

    if (!token) {
      router.push('/login');
      return;
    }

    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      
      // Check if user is admin
      if (parsedUser.role !== 'admin') {
        router.push('/dashboard');
        return;
      }
    }

    fetchCategories(token);
  }, [router]);

  const fetchCategories = async (token: string) => {
    try {
      const response = await fetch('http://localhost:5000/api/categories', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:5000/api/categories', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(categoryForm),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create category');
      }

      setMessage({ type: 'success', text: 'Kategorija veiksmīgi izveidota!' });
      setCategoryForm({ name: '', description: '', color: '#3b82f6' });
      
      // Refresh categories
      const token2 = localStorage.getItem('access_token');
      if (token2) {
        fetchCategories(token2);
      }

      setTimeout(() => {
        setCreateDialogOpen(false);
        setMessage({ type: '', text: '' });
      }, 2000);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Kļūda izveidojot kategoriju' 
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory) return;

    setSubmitLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:5000/api/categories/${selectedCategory.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(categoryForm),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update category');
      }

      setMessage({ type: 'success', text: 'Kategorija veiksmīgi atjaunināta!' });
      
      // Refresh categories
      const token2 = localStorage.getItem('access_token');
      if (token2) {
        fetchCategories(token2);
      }

      setTimeout(() => {
        setEditDialogOpen(false);
        setSelectedCategory(null);
        setMessage({ type: '', text: '' });
      }, 2000);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Kļūda atjauninot kategoriju' 
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (categoryId: number, categoryName: string) => {
    if (!confirm(`Vai tiešām vēlaties dzēst kategoriju "${categoryName}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:5000/api/categories/${categoryId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete category');
      }

      setMessage({ type: 'success', text: 'Kategorija veiksmīgi dzēsta!' });
      
      // Refresh categories
      const token2 = localStorage.getItem('access_token');
      if (token2) {
        fetchCategories(token2);
      }

      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Kļūda dzēšot kategoriju' 
      });
    }
  };

  const openEditDialog = (category: Category) => {
    setSelectedCategory(category);
    setCategoryForm({
      name: category.name,
      description: category.description || '',
      color: category.color
    });
    setEditDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('lv-LV', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Ielādē kategorijas...</p>
        </div>
      </div>
    );
  }

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="text-center py-8">
            <h2 className="text-xl font-semibold mb-4">Nav piekļuves</h2>
            <p className="text-gray-600 mb-4">Šī lapa pieejama tikai administratoriem.</p>
            <Button onClick={() => router.push('/dashboard')}>
              Atgriezties uz paneli
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
              <div className="w-6 h-6 bg-white rounded"></div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Kategoriju pārvaldība
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Izveidojiet un pārvaldiet dokumentu kategorijas
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button onClick={() => router.push('/dashboard')}>
              Pārvaldības panelis
            </Button>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>Jauna kategorija</Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Izveidot jaunu kategoriju</DialogTitle>
                  <DialogDescription>
                    Aizpildiet informāciju jaunajai kategorijai
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleCreate} className="space-y-4">
                  {message.text && (
                    <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
                      <AlertDescription>{message.text}</AlertDescription>
                    </Alert>
                  )}

                  <div>
                    <Label htmlFor="name">Nosaukums</Label>
                    <Input
                      id="name"
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Kategorijas nosaukums"
                      required
                      disabled={submitLoading}
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Apraksts</Label>
                    <Textarea
                      id="description"
                      value={categoryForm.description}
                      onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Kategorijas apraksts"
                      disabled={submitLoading}
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="color">Krāsa</Label>
                    <div className="grid grid-cols-5 gap-2 mt-2">
                      {colorOptions.map(color => (
                        <button
                          key={color.value}
                          type="button"
                          className={`w-8 h-8 rounded-full border-2 ${
                            categoryForm.color === color.value 
                              ? 'border-gray-900 dark:border-white' 
                              : 'border-gray-300'
                          }`}
                          style={{ backgroundColor: color.value }}
                          onClick={() => setCategoryForm(prev => ({ ...prev, color: color.value }))}
                          title={color.name}
                          disabled={submitLoading}
                        />
                      ))}
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={submitLoading}>
                    {submitLoading ? 'Izveido...' : 'Izveidot kategoriju'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Messages */}
        {message.text && !createDialogOpen && !editDialogOpen && (
          <Alert className="mb-8" variant={message.type === 'error' ? 'destructive' : 'default'}>
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map(category => (
            <Card key={category.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: category.color }}
                    />
                    <div>
                      <CardTitle className="text-lg">{category.name}</CardTitle>
                      <CardDescription>
                        {category.documents_count} {category.documents_count === 1 ? 'dokuments' : 'dokumenti'}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge 
                    style={{ backgroundColor: category.color }}
                    className="text-white"
                  >
                    {category.documents_count}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                {category.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                    {category.description}
                  </p>
                )}
                
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Izveidots: {formatDate(category.created_at)}
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => openEditDialog(category)}
                    className="flex-1"
                  >
                    Rediģēt
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => handleDelete(category.id, category.name)}
                    disabled={category.documents_count > 0}
                  >
                    Dzēst
                  </Button>
                </div>
                
                {category.documents_count > 0 && (
                  <p className="text-xs text-gray-500 mt-2">
                    Nevar dzēst kategoriju, kurā ir dokumenti
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {categories.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center mx-auto mb-4">
                <div className="w-8 h-8 bg-gray-400 dark:bg-gray-500 rounded"></div>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Nav kategoriju
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Izveidojiet savu pirmo kategoriju dokumentu organizēšanai.
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                Izveidot kategoriju
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Rediģēt kategoriju</DialogTitle>
            <DialogDescription>
              Mainiet kategorijas informāciju
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleEdit} className="space-y-4">
            {message.text && (
              <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
                <AlertDescription>{message.text}</AlertDescription>
              </Alert>
            )}

            <div>
              <Label htmlFor="edit-name">Nosaukums</Label>
              <Input
                id="edit-name"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Kategorijas nosaukums"
                required
                disabled={submitLoading}
              />
            </div>

            <div>
              <Label htmlFor="edit-description">Apraksts</Label>
              <Textarea
                id="edit-description"
                value={categoryForm.description}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Kategorijas apraksts"
                disabled={submitLoading}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="edit-color">Krāsa</Label>
              <div className="grid grid-cols-5 gap-2 mt-2">
                {colorOptions.map(color => (
                  <button
                    key={color.value}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 ${
                      categoryForm.color === color.value 
                        ? 'border-gray-900 dark:border-white' 
                        : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color.value }}
                    onClick={() => setCategoryForm(prev => ({ ...prev, color: color.value }))}
                    title={color.name}
                    disabled={submitLoading}
                  />
                ))}
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={submitLoading}>
              {submitLoading ? 'Saglabā...' : 'Saglabāt izmaiņas'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}