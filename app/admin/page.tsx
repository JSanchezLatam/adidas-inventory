'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
import { createClient } from '@/lib/supabase/client'

export default function AdminPage() {
  const { role, clearAuth } = useAuthStore()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    clearAuth()
    router.push('/login')
  }

  const menuItems = [
    {
      href: '/admin/products',
      icon: '📦',
      title: 'Productos',
      desc: 'Agregar, editar e importar productos',
      adminOnly: false,
    },
    {
      href: '/admin/shelves',
      icon: '🗄️',
      title: 'Anaqueles',
      desc: 'Gestionar anaqueles y zonas',
      adminOnly: true,
    },
    {
      href: '/admin/assign',
      icon: '📍',
      title: 'Asignar ubicacion',
      desc: 'Mover o asignar producto a un anaquel',
      adminOnly: true,
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-black px-4 pt-12 pb-6">
        <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">adidas</p>
        <h1 className="text-white text-xl font-bold">Administracion</h1>
        <p className="text-gray-400 text-sm mt-1 capitalize">Rol: {role ?? 'staff'}</p>
      </header>

      <main className="px-4 py-4 flex flex-col gap-3 pb-24">
        {menuItems
          .filter((item) => !item.adminOnly || role === 'admin')
          .map((item) => (
            <Link key={item.href} href={item.href}>
              <div className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center gap-4 active:bg-gray-50">
                <span className="text-3xl">{item.icon}</span>
                <div>
                  <p className="font-semibold text-gray-900">{item.title}</p>
                  <p className="text-sm text-gray-500">{item.desc}</p>
                </div>
                <svg
                  className="w-5 h-5 text-gray-300 ml-auto flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}

        <button
          onClick={handleLogout}
          className="mt-4 text-sm text-red-500 text-center py-2"
        >
          Cerrar sesion
        </button>
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex">
        <a href="/" className="flex-1 flex flex-col items-center py-3 text-gray-400">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <span className="text-xs mt-1">Buscar</span>
        </a>
        <a href="/admin" className="flex-1 flex flex-col items-center py-3 text-black">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-xs mt-1 font-semibold">Admin</span>
        </a>
      </nav>
    </div>
  )
}
