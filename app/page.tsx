"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Check, Layers3, Plus } from "lucide-react";
import BrandLogo from "@/components/ui/BrandLogo";
import DecorativeLayer from "@/components/ui/DecorativeLayer";

export default function LandingPage() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") router.replace("/dashboard");
  }, [status, router]);

  if (status === "loading") {
    return <div className="app-shell grid min-h-screen place-items-center"><div className="skeleton-pulse h-10 w-10 rounded-full" /></div>;
  }

  return (
    <div className="relative min-h-screen text-[#172033]">
      <header className="sticky top-0 z-30 border-b border-white/70 bg-white/65 backdrop-blur-2xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link href="/">
            <BrandLogo markClassName="h-8 w-8" />
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/auth/signin" className="btn-ghost px-4 py-2 text-sm">Нэвтрэх</Link>
            <Link href="/auth/signup" className="btn-primary px-4 py-2 text-sm">Бүртгүүлэх</Link>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-14 px-5 py-16 sm:px-8 lg:grid-cols-[.9fr_1.1fr] lg:py-20">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .3 }}>
            <p className="eyebrow mb-4">Өдөр бүр бага багаар суралц</p>
            <h1 className=" max-w-2xl text-5xl font-bold leading-[1.02] tracking-[-.065em] sm:text-7xl">

               <span className="brand-wordmark-font">
                Nudl<span className="brand-wordmark-eye">eye</span>
              </span>

              <span className="block text-[#9a6418]">Flashcards.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-[#656976]">
              Сурахыг хүссэн хэл, сэдвийнхээ үгсийг амархан тогтоогоорой.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/auth/signup" className="btn-primary px-6 py-3.5">Туршиж үзэх <ArrowRight className="h-4 w-4" /></Link>
              <Link href="/auth/signin" className="btn-secondary px-6 py-3.5">Нэвтрэх</Link>
            </div>
            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[#747783]">
              {["Ямар ч хэл, сэдэв", "Танд тохирсон ухаалаг давталтын арга", "Хязгааргүй үгийн сангаа бүтээгээрэй"].map((item) => (
                <span key={item} className="flex items-center gap-1.5"><Check className="h-4 w-4 text-[#238769]" />{item}</span>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .4, delay: .08 }} className="relative mx-auto w-full max-w-2xl">
            <motion.div whileHover={{ y: -4, rotateX: 1 }} transition={{ duration: .2 }} className="flashcard-surface relative min-h-[410px] overflow-hidden">
              <DecorativeLayer variant="hero" />
              <div className="flex items-center justify-between border-b border-[#e6e8ee] px-5 py-3 text-xs text-[#7b7f8c]">
                <span className="font-semibold">TOPIK II</span>
                <span className="rounded-full bg-[#fff1c7] px-2.5 py-1 font-semibold text-[#84530f]">8 / 18</span>
              </div>
              <div className="grid min-h-[292px] place-items-center px-6 py-10 text-center">
                <div>
                  <div className="mt-5 text-4xl font-bold tracking-[-.04em]">외우자!</div>
                  <div className="mx-auto mt-8 max-w-sm rounded-2xl border border-[#dfe3ec] bg-white/85 px-4 py-3.5 text-left text-sm text-[#9a9da8] shadow-sm">
                    Хариултаа бичнэ үү...
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-[#e6e8ee] bg-[#fafbfc] px-5 py-4">
                <span className="text-xs text-[#7b7f8c]">Танд давтах 18 үг байна.</span>
                <span className="rounded-xl bg-[#211e19] px-4 py-2.5 text-xs font-bold text-[#fffaf0] shadow-lg shadow-black/15">Хариулт шалгах</span>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: .45 }} className="absolute -right-4 top-14 hidden rounded-2xl border border-white/80 bg-white/85 p-3 shadow-xl backdrop-blur-xl sm:block">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#929184]">Дуусгасан</div>
              <div className="mt-1 text-sm font-bold text-[#39745e]">12 карт</div>
            </motion.div>
          </motion.div>
        </section>

        <section className="border-y border-white/80 bg-white/60 backdrop-blur-xl">
          <div className="mx-auto grid max-w-7xl md:grid-cols-3">
            {[
              { number: "01", title: "Өөрийн үгийн сангаа үүсгэ", text: "Сурахыг хүссэн үгсээ цуглуулаад, хүссэн үедээ давтаарай.", icon: Plus },
              { number: "02", title: "Картаар өөрийгөө шалга", text: "Үг, утгыг ээлжлэн харж, илүү амархан тогтоогоорой.", icon: Layers3 },
              { number: "03", title: "Өдөр бүр хэдхэн минут давт", text: "Давтах цаг нь болсон үгсээ хараад, өдөр бүр хэдхэн минут зарцуулан тогтоогоорой.", icon: ArrowRight },
            ].map(({ number, title, text, icon: Icon }) => (
              <motion.article whileHover={{ backgroundColor: "rgba(255,255,255,.72)" }} key={number} className="border-[#e2e3e7] px-6 py-9 transition md:border-r md:last:border-r-0">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#9a6418]">{number}</span>
                  <Icon className="h-4 w-4 text-[#8a8e9b]" />
                </div>
                <h2 className="mt-5 text-lg font-bold">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-[#707480]">{text}</p>
              </motion.article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
          <div className="grid gap-8 lg:grid-cols-[.75fr_1.25fr] lg:items-center">
            <div>
              <p className="eyebrow">Нэг суралцах урсгал</p>
              <h2 className="mt-3 text-3xl font-bold tracking-[-.04em]">Сурах зүйлээ нэг дороос ойлгомжтойгоор.</h2>
              <p className="mt-4 text-sm leading-7 text-[#707480]">Nudleye зөвхөн үг хадгалах газар биш. Юуг давтах, ямар үгээ сайн сурсан, дараа нь хаанаас эхлэхээ хялбархан хянаарай.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ["IELTS Academic", "48 үг", "12 үг давтах", "#f3d997"],
                ["Programming terms", "36 үг", "8 үг суралцаж буй", "#fff6e8"],
                ["TOPIK суурь үгс", "64 үг", "78% эзэмшсэн", "#eaf7f1"],
              ].map(([title, count, statusText, color], index) => (
                <motion.div whileHover={{ y: -4 }} key={title} className="study-set-card overflow-hidden p-4">
                  <div className="-mx-4 -mt-4 mb-5 h-1.5" style={{ background: color }} />
                  <div className="font-mono text-[10px] font-bold text-[#929baa]">{String(index + 1).padStart(2, "0")}</div>
                  <h3 className="mt-5 font-bold">{title}</h3>
                  <p className="mt-1 text-xs text-[#777b87]">{count}</p>
                  <div className="mt-5 border-t border-[#e6ded0] pt-3 text-xs font-semibold text-[#84530f]">{statusText}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/80 bg-white/60 px-5 py-8 backdrop-blur-xl sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-xs text-[#8c909c] sm:flex-row">
          <span>© {new Date().getFullYear()} Nudleye</span>
          <div className="flex items-center gap-5">
            <Link href="/privacy" className="hover:text-[#4a4d58]">Нууцлалын бодлого</Link>
            <Link href="/terms" className="hover:text-[#4a4d58]">Үйлчилгээний нөхцөл</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
