import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export default async function DebugPage() {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll()

    return (
        <div className="p-8 font-mono text-sm max-w-4xl mx-auto space-y-8">
            <h1 className="text-2xl font-bold mb-4">Debug Information</h1>

            <section className="bg-slate-100 p-4 rounded border">
                <h2 className="font-bold text-lg mb-2">Auth Status</h2>
                <div>User ID: {user?.id || 'None'}</div>
                <div>Email: {user?.email || 'None'}</div>
                <div>Error: {error ? JSON.stringify(error) : 'None'}</div>
            </section>

            <section className="bg-slate-100 p-4 rounded border">
                <h2 className="font-bold text-lg mb-2">Cookies Received by Server ({allCookies.length})</h2>
                <div className="space-y-1">
                    {allCookies.map(c => (
                        <div key={c.name} className="break-all border-b py-1">
                            <span className="font-bold">{c.name}:</span>
                            <br />
                            <span className="text-slate-600">{c.value.substring(0, 20)}...</span>
                        </div>
                    ))}
                </div>
            </section>

            <section className="bg-slate-100 p-4 rounded border">
                <h2 className="font-bold text-lg mb-2">Environment Check</h2>
                <div>URL Configured: {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Yes (Starts with ' + process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 10) + ')' : 'No'}</div>
                <div>Key Configured: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Yes' : 'No'}</div>
            </section>
        </div>
    )
}
