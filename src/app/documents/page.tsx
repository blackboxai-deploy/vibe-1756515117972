"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';


interface Document {
  id: number;
  title: string;
  filename: string;
  file_size_formatted: string;
  file_type: string;
  upload_date: string;
  description?: string;
  category?: {
    id: number;
    name: string;
    color: string;
  };
  tags: string[];
}

interface Category {
  id: number;
  name: string;
  color: string;
  description?: string;
}

function DocumentsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    file: null as File | null,
    title: '',
    description: '',
    category_id: '',
    tags: ''
  });
  const [uploadLoading, setUploadLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login');
      return;
    }

    fetchData(token);

    // Check if upload action is requested
    const action = searchParams.get('action');
    if (action === 'upload') {
      setUploadDialogOpen(true);
    }
  }, [router, searchParams]);

  const fetchData = async (token: string) => {
    try {
      // Fetch documents
      const docsResponse = await fetch('http://localhost:5000/api/documents', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (docsResponse.ok) {
        const docsData = await docsResponse.json();
        setDocuments(docsData.documents);
      }

      // Fetch categories
      const catsResponse = await fetch('http://localhost:5000/api/categories', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (catsResponse.ok) {
        const catsData = await catsResponse.json();
        setCategories(catsData.categories);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadForm(prev => ({
        ...prev,
        file,
        title: prev.title || file.name.split('.').slice(0, -1).join('.')
      }));
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.file) return;

    setUploadLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const formData = new FormData();
      formData.append('file', uploadForm.file);
      formData.append('title', uploadForm.title);
      formData.append('description', uploadForm.description);
      if (uploadForm.category_id) {
        formData.append('category_id', uploadForm.category_id);
      }
      if (uploadForm.tags) {
        formData.append('tags', uploadForm.tags);
      }

      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:5000/api/documents/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setMessage({ type: 'success', text: 'Dokuments veiksmīgi augšupielādēts!' });
      setUploadForm({
        file: null,
        title: '',
        description: '',
        category_id: '',
        tags: ''
      });

      // Refresh documents
      const token2 = localStorage.getItem('access_token');
      if (token2) {
        fetchData(token2);
      }

      setTimeout(() => {
        setUploadDialogOpen(false);
        setMessage({ type: '', text: '' });
      }, 2000);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Kļūda augšupielādējot dokumentu' 
      });
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDownload = async (documentId: number, filename: string) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:5000/api/documents/${documentId}/download`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: 'Kļūda lejupielādējot dokumentu' 
      });
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = !searchTerm || 
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = !selectedCategory || 
      doc.category?.id.toString() === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('lv-LV', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Ielādē dokumentus...</p>
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
                Dokumenti
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Pārvaldiet savus dokumentus
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button onClick={() => router.push('/dashboard')}>
              Pārvaldības panelis
            </Button>
            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button>Augšupielādēt dokumentu</Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Augšupielādēt dokumentu</DialogTitle>
                  <DialogDescription>
                    Izvēlieties failu un aizpildiet informāciju
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleUpload} className="space-y-4">
                  {message.text && (
                    <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
                      <AlertDescription>{message.text}</AlertDescription>
                    </Alert>
                  )}

                  <div>
                    <Label htmlFor="file">Fails</Label>
                    <Input
                      id="file"
                      type="file"
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.gif,.xlsx,.xls,.ppt,.pptx"
                      required
                      disabled={uploadLoading}
                    />
                  </div>

                  <div>
                    <Label htmlFor="title">Nosaukums</Label>
                    <Input
                      id="title"
                      value={uploadForm.title}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Dokumenta nosaukums"
                      required
                      disabled={uploadLoading}
                    />
                  </div>

                  <div>
                    <Label htmlFor="category">Kategorija (neobligāti)</Label>
                    <Select 
                      value={uploadForm.category_id} 
                      onValueChange={(value) => setUploadForm(prev => ({ ...prev, category_id: value }))}
                      disabled={uploadLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Izvēlieties kategoriju" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat.id} value={cat.id.toString()}>
                            <div className="flex items-center space-x-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: cat.color }}
                              />
                              <span>{cat.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="description">Apraksts (neobligāts)</Label>
                    <Textarea
                      id="description"
                      value={uploadForm.description}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Dokumenta apraksts"
                      disabled={uploadLoading}
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="tags">Tagi (neobligāti)</Label>
                    <Input
                      id="tags"
                      value={uploadForm.tags}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, tags: e.target.value }))}
                      placeholder="tagi, atdalīti, ar, komatiem"
                      disabled={uploadLoading}
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={uploadLoading || !uploadForm.file}>
                    {uploadLoading ? 'Augšupielādē...' : 'Augšupielādēt'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Search and Filter */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Meklēt un filtrēt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Meklēt dokumentus..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="w-full sm:w-64">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Visas kategorijas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Visas kategorijas</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: cat.color }}
                          />
                          <span>{cat.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Messages */}
        {message.text && !uploadDialogOpen && (
          <Alert className="mb-8" variant={message.type === 'error' ? 'destructive' : 'default'}>
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        {/* Documents Grid */}
        {filteredDocuments.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center mx-auto mb-4">
                <div className="w-8 h-8 bg-gray-400 dark:bg-gray-500 rounded"></div>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Nav atrasti dokumenti
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {searchTerm || selectedCategory 
                  ? 'Mainiet meklēšanas kritērijus vai augšupielādējiet jaunu dokumentu.'
                  : 'Sāciet, augšupielādējot savu pirmo dokumentu.'
                }
              </p>
              <Button onClick={() => setUploadDialogOpen(true)}>
                Augšupielādēt dokumentu
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocuments.map(doc => (
              <Card key={doc.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                          {doc.file_type.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">{doc.title}</CardTitle>
                        <CardDescription className="text-sm">
                          {doc.filename} • {doc.file_size_formatted}
                        </CardDescription>
                      </div>
                    </div>
                    {doc.category && (
                      <Badge 
                        style={{ backgroundColor: doc.category.color }}
                        className="text-white text-xs"
                      >
                        {doc.category.name}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  {doc.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
                      {doc.description}
                    </p>
                  )}
                  
                  {doc.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {doc.tags.slice(0, 3).map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {doc.tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{doc.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                    <span>Augšupielādēts</span>
                    <span>{formatDate(doc.upload_date)}</span>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleDownload(doc.id, doc.filename)}
                    >
                      Lejupielādēt
                    </Button>
                    <Button size="sm" variant="outline">
                      Rediģēt
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function DocumentsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-300">Ielādē...</p>
      </div>
    </div>}>
      <DocumentsPageContent />
    </Suspense>
  );
}