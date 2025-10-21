"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Brain } from "lucide-react";

export default function LandingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-violet-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Ambient background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        />
        <div
          className="absolute top-1/2 left-1/2 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "4s" }}
        />
      </div>

      {/* Simple Header */}
      <nav className="relative border-b border-white/5 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-purple-500 rounded-2xl blur-lg opacity-50" />
                <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
                  <Brain className="w-6 h-6" />
                </div>
              </div>
              <span className="text-xl font-bold">FlashDemo</span>
            </div>

            <div className="flex items-center gap-2">
              <a
                href="/auth/signin"
                className="px-4 py-2 text-sm text-white/60 hover:text-white transition-colors"
              >
                Нэвтрэх
              </a>
              <a
                href="/auth/signup"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 text-sm font-medium hover:scale-105 transition-transform"
              >
                Эхлэх
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 min-h-[calc(100vh-80px)] flex items-center justify-center">
        <div className="text-center space-y-8 w-full">
          <div className="space-y-6">
            <h1 className="text-5xl md:text-7xl font-black bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400 bg-clip-text text-transparent leading-tight">
              Lorem ipsum dolor, sit amet consectetur adipisicing.
            </h1>
            <p className="text-xl md:text-2xl text-white/70 max-w-3xl mx-auto leading-relaxed">
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Amet nisi culpa saepe numquam quidem earum maiores nemo nesciunt a neque.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a
              href="/auth/signup"
              className="inline-block group relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-purple-600 rounded-2xl blur-lg opacity-50 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-gradient-to-r from-violet-500 to-purple-500 rounded-2xl px-10 py-5 font-bold text-lg hover:scale-105 transition-transform">
                 Бүртгүүлэх
              </div>
            </a>
            <a
              href="/auth/signin"
              className="inline-block px-10 py-5 bg-white/5 border-2 border-white/10 rounded-2xl font-semibold text-lg hover:bg-white/10 hover:border-white/20 transition-all"
            >
              Нэвтрэх
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}