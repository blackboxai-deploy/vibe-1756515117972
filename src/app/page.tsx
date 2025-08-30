"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      router.push('/dashboard');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="mb-8">
            <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                <div className="w-8 h-8 bg-blue-600 rounded"></div>
              </div>
            </div>
            <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Dokumentu Menedžmenta Sistēma
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Profesionāla dokumentu pārvaldības platforma uzņēmumiem un personām. 
              Droši glabājiet, pārvaldiet un piekļūstiet saviem dokumentiem no jebkurās vietas.
            </p>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <div className="w-6 h-6 bg-green-600 rounded"></div>
              </div>
              <CardTitle>Droša glabāšana</CardTitle>
              <CardDescription>
                Jūsu dokumenti tiek droši glabāti ar uzlabotu drošības līmeni
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <div className="w-6 h-6 bg-purple-600 rounded"></div>
              </div>
              <CardTitle>Ātra meklēšana</CardTitle>
              <CardDescription>
                Atrodiet nepieciešamos dokumentus ātri ar mūsu uzlaboto meklēšanas sistēmu
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <div className="w-6 h-6 bg-orange-600 rounded"></div>
              </div>
              <CardTitle>Kategorizācija</CardTitle>
              <CardDescription>
                Organizējiet dokumentus ar kategorijām un tagiem ērtākai pārvaldībai
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="max-w-2xl mx-auto border-0 shadow-xl">
            <CardContent className="p-12">
              <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
                Sāciet jau šodien
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-8">
                Pievienojieties tūkstošiem lietotāju, kuri uzticas mūsu platformai savu dokumentu pārvaldībai.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  className="px-8 py-3"
                  onClick={() => router.push('/login')}
                >
                  Pieslēgties
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="px-8 py-3"
                  onClick={() => router.push('/register')}
                >
                  Reģistrēties
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Section */}
        <div className="mt-20 text-center">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">500+</div>
              <div className="text-gray-600 dark:text-gray-300">Aktīvi lietotāji</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600 mb-2">10K+</div>
              <div className="text-gray-600 dark:text-gray-300">Dokumenti</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600 mb-2">99.9%</div>
              <div className="text-gray-600 dark:text-gray-300">Darbības laiks</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-600 mb-2">24/7</div>
              <div className="text-gray-600 dark:text-gray-300">Atbalsts</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}