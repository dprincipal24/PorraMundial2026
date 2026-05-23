import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Navbar } from '@/components/Navbar'

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, is_admin, avatar_url')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar
        isAdmin={profile?.is_admin ?? false}
        userName={profile?.name ?? user.email}
        userAvatar={profile?.avatar_url}
      />
      <main className="flex-1">{children}</main>
    </div>
  )
}
