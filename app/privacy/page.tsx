import Link from "next/link";
import type { Metadata } from "next";
import { Ban, CircleCheck, Database, Eye, ListChecks, Lock, Mail, Share2, Trash2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Нууцлалын бодлого",
  description: "Nudleye хэрэглэгчийн ямар мэдээллийг цуглуулж, хэрхэн ашигладаг тухай — энгийн хэлээр.",
};

const SECTIONS = [
  { id: "medeelel", icon: Database, title: "Бид ямар мэдээлэл хадгалдаг вэ?" },
  { id: "yaagaad", icon: ListChecks, title: "Яагаад хадгалдаг вэ?" },
  { id: "busad-hun", icon: Eye, title: "Бусад хүн юу харж чадах вэ?" },
  { id: "gurav-dagch", icon: Share2, title: "Бид мэдээллийг бусдад өгдөг үү?" },
  { id: "ustgah", icon: Trash2, title: "Мэдээллээ устгах" },
  { id: "hamgaalalt", icon: Lock, title: "Бид хэрхэн хамгаалдаг вэ?" },
  { id: "asuult", icon: Mail, title: "Асуух зүйл байвал" },
] as const;

export default function PrivacyPage() {
  return (
    <div className="app-shell app-content min-h-screen">
      <main className="page-canvas max-w-5xl">
        <Link href="/" className="btn-ghost mb-6 px-2 py-2 text-sm">Нүүр хуудас</Link>

        <header className="mb-6 max-w-2xl">
          <p className="eyebrow mb-2">Хууль эрх зүй</p>
          <h1 className="text-3xl font-bold tracking-[-.04em] sm:text-4xl">Нууцлалын бодлого</h1>
          <p className="mt-3 text-sm leading-6 text-[#777985]">
            Nudleye-д итгэж бүртгүүлсэнд баярлалаа.
          </p>
        </header>

        <div className="mb-10 grid gap-3 rounded-2xl border border-[#d9ecdf] bg-[#f2faf5] p-5 sm:grid-cols-3">
          <div className="flex items-start gap-2.5">
            <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#238769]" />
            <p className="text-sm leading-6 text-[#2c5847]">Мэдээллийг зөвхөн апп-ыг ажиллуулахад шаардлагатай хэмжээгээр ашигладаг</p>
          </div>
          <div className="flex items-start gap-2.5">
            <Ban className="mt-0.5 h-4 w-4 shrink-0 text-[#238769]" />
            <p className="text-sm leading-6 text-[#2c5847]">Мэдээллийг чинь хэзээ ч зарахгүй, сурталчилгаанд зориулж дамжуулахгүй</p>
          </div>
          <div className="flex items-start gap-2.5">
            <Trash2 className="mt-0.5 h-4 w-4 shrink-0 text-[#238769]" />
            <p className="text-sm leading-6 text-[#2c5847]">Хүссэн үедээ бүртгэл болон бүх мэдээллээ бүрмөсөн устгах боломжтой</p>
          </div>
        </div>

        <div className="grid gap-10 lg:grid-cols-[13rem_1fr] lg:items-start">
          <nav aria-label="Хуудасны агуулга" className="hidden lg:sticky lg:top-8 lg:block">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-[#9a9da7]">Энэ хуудсанд</p>
            <ul className="space-y-1 border-l border-[#e6e3da] pl-3">
              {SECTIONS.map(({ id, icon: Icon, title }) => (
                <li key={id}>
                  <a href={`#${id}`} className="flex items-center gap-2 rounded-lg py-1.5 text-xs leading-5 text-[#707480] transition hover:text-[#84530f]">
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    {title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="space-y-5">
            <section id="medeelel" className="scroll-mt-8 rounded-2xl border border-[#e6e3da] bg-[#fffdf8] p-5 sm:p-6">
              <div className="mb-3 flex items-center gap-2.5">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#fff1c7] text-[#84530f]"><Database className="h-4 w-4" /></span>
                <h2 className="text-base font-bold text-[#211f1a]">Бид ямар мэдээлэл хадгалдаг вэ?</h2>
              </div>
              <div className="space-y-3 text-sm leading-7 text-[#4a4d58]">
                <p>Бүртгэл үүсгэх үед таны нэр, и-мэйл хаяг болон нууц үгийг хадгалдаг. Нууц үг тань унших боломжгүй байдлаар хамгаалагддаг тул бид хүртэл харах боломжгүй.</p>
                <p>Хэрэв Google-ээр нэвтэрвэл Google-ээс зөвшөөрсөн нэр, и-мэйл болон профайл зургийг ашиглана.</p>
                <p>Мөн таны үүсгэсэн багц, карт, суралцах ахиц болон давталтын мэдээллийг хадгалдаг. Ингэснээр та ямар төхөөрөмжөөс орсон ч өмнөх газраасаа үргэлжлүүлэн суралцах боломжтой.</p>
              </div>
            </section>

            <section id="yaagaad" className="scroll-mt-8 rounded-2xl border border-[#e6e3da] bg-[#fffdf8] p-5 sm:p-6">
              <div className="mb-3 flex items-center gap-2.5">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#fff1c7] text-[#84530f]"><ListChecks className="h-4 w-4" /></span>
                <h2 className="text-base font-bold text-[#211f1a]">Яагаад хадгалдаг вэ?</h2>
              </div>
              <p className="mb-3 text-sm leading-7 text-[#4a4d58]">Эдгээр мэдээлэл зөвхөн дараах зорилготой:</p>
              <ul className="space-y-2">
                {[
                  "Бүртгэлийг тань таних",
                  "Суралцах ахицыг хадгалах",
                  "Давтах зөв цагийг тооцоолох",
                  "Хэрэв зөвшөөрсөн бол сануулах и-мэйл илгээх",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm leading-6 text-[#4a4d58]">
                    <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#238769]" />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-sm leading-7 text-[#4a4d58]">Өөр ямар нэгэн зорилгоор ашиглахгүй.</p>
            </section>

            <section id="busad-hun" className="scroll-mt-8 rounded-2xl border border-[#e6e3da] bg-[#fffdf8] p-5 sm:p-6">
              <div className="mb-3 flex items-center gap-2.5">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#fff1c7] text-[#84530f]"><Eye className="h-4 w-4" /></span>
                <h2 className="text-base font-bold text-[#211f1a]">Бусад хүн юу харж чадах вэ?</h2>
              </div>
              <p className="text-sm leading-7 text-[#4a4d58]">
                Таны нэр, и-мэйл болон суралцах мэдээлэл хувийнх хэвээр үлдэнэ. Хэрэв багцаа <strong>&ldquo;Бусдад нээлттэй&rdquo;</strong> болгосон бол тухайн багцын агуулгыг бусад хэрэглэгч үзэж, өөрийн сандаа хуулж ашиглах боломжтой. Харин хувийн багцыг зөвхөн та өөрөө харах боломжтой.
              </p>
            </section>

            <section id="gurav-dagch" className="scroll-mt-8 rounded-2xl border border-[#e6e3da] bg-[#fffdf8] p-5 sm:p-6">
              <div className="mb-3 flex items-center gap-2.5">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#fff1c7] text-[#84530f]"><Share2 className="h-4 w-4" /></span>
                <h2 className="text-base font-bold text-[#211f1a]">Бид мэдээллийг бусдад өгдөг үү?</h2>
              </div>
              <p className="text-sm font-semibold leading-6 text-[#211f1a]">Үгүй.</p>
              <p className="mt-2 text-sm leading-7 text-[#4a4d58]">Аппыг ажиллуулахад тусалдаг үйлчилгээ ашигладаг ч тэд таны мэдээллийг зөвхөн тухайн үйлчилгээг үзүүлэх хэмжээнд боловсруулдаг бөгөөд өөр ямар нэгэн зорилгоор ашиглах, дамжуулах эрхгүй.</p>
            </section>

            <section id="ustgah" className="scroll-mt-8 rounded-2xl border border-[#e6e3da] bg-[#fffdf8] p-5 sm:p-6">
              <div className="mb-3 flex items-center gap-2.5">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#fff1c7] text-[#84530f]"><Trash2 className="h-4 w-4" /></span>
                <h2 className="text-base font-bold text-[#211f1a]">Мэдээллээ устгах</h2>
              </div>
              <p className="text-sm leading-7 text-[#4a4d58]">
                Хүссэн үедээ <Link href="/profile" className="font-semibold text-[#84530f] underline underline-offset-2">Профайл → Бүртгэл устгах</Link> хэсгээс бүртгэлээ устгаж болно. Устгасны дараа таны багц, карт, суралцах ахиц болон бусад мэдээлэл бүрмөсөн устах бөгөөд буцаан сэргээх боломжгүй.
              </p>
            </section>

            <section id="hamgaalalt" className="scroll-mt-8 rounded-2xl border border-[#e6e3da] bg-[#fffdf8] p-5 sm:p-6">
              <div className="mb-3 flex items-center gap-2.5">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#fff1c7] text-[#84530f]"><Lock className="h-4 w-4" /></span>
                <h2 className="text-base font-bold text-[#211f1a]">Бид хэрхэн хамгаалдаг вэ?</h2>
              </div>
              <p className="text-sm leading-7 text-[#4a4d58]">
                Таны мэдээллийг хамгаалахын тулд аюулгүй холболт болон орчин үеийн хамгаалалтын арга ашигладаг. Нууц үгийг эргэн унших боломжгүй байдлаар хадгалдаг тул бид хүртэл мэдэх боломжгүй.
              </p>
            </section>

            <section id="asuult" className="scroll-mt-8 rounded-2xl border border-[#e6e3da] bg-[#fffdf8] p-5 sm:p-6">
              <div className="mb-3 flex items-center gap-2.5">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#fff1c7] text-[#84530f]"><Mail className="h-4 w-4" /></span>
                <h2 className="text-base font-bold text-[#211f1a]">Асуух зүйл байвал</h2>
              </div>
              <p className="text-sm leading-7 text-[#4a4d58]">Ямар нэгэн асуулт, санал байвал бүртгэлтэй и-мэйл хаягаараа бидэнтэй холбогдоорой.</p>
            </section>
          </div>
        </div>

        <p className="mt-10 text-xs text-[#9a9da7]">
          Сүүлд шинэчилсэн: 2026 оны 7-р сар · Мөн манай <Link href="/terms" className="underline underline-offset-2">Үйлчилгээний нөхцөл</Link>-той танилцана уу.
        </p>
      </main>
    </div>
  );
}
