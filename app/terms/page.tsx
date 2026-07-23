import Link from "next/link";
import type { Metadata } from "next";
import { Ban, FileText, Layers3, LogOut, Mail, RefreshCw, ShieldAlert, UserCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Үйлчилгээний нөхцөл",
  description: "Nudleye үйлчилгээг ашиглах нөхцөл — энгийн хэлээр.",
};

const SECTIONS = [
  { id: "tuhai", icon: FileText, title: "Nudleye гэж юу вэ?" },
  { id: "burtgel", icon: UserCircle, title: "Бүртгэлийн тухай" },
  { id: "bagts", icon: Layers3, title: "Таны үүсгэсэн багцууд" },
  { id: "horigloh", icon: Ban, title: "Юу хийхгүй байхыг хүсэх вэ" },
  { id: "uilchilgee", icon: ShieldAlert, title: "Үйлчилгээний тухай" },
  { id: "haah", icon: LogOut, title: "Бүртгэлээ хаах" },
  { id: "shinechlel", icon: RefreshCw, title: "Нөхцөл шинэчлэгдэх" },
  { id: "holboo", icon: Mail, title: "Холбоо барих" },
] as const;

export default function TermsPage() {
  return (
    <div className="app-shell app-content min-h-screen">
      <main className="page-canvas max-w-5xl">
        <Link href="/" className="btn-ghost mb-6 px-2 py-2 text-sm">Нүүр хуудас</Link>

        <header className="mb-10 max-w-2xl">
          <p className="eyebrow mb-2">Хууль эрх зүй</p>
          <h1 className="text-3xl font-bold tracking-[-.04em] sm:text-4xl">Үйлчилгээний нөхцөл</h1>
          <p className="mt-3 text-sm leading-6 text-[#777985]">
            Товчхондоо: бусдыг хүндэл, өөрийн үүсгэсэн зүйлээ өмчилсөн хэвээр байна, хэдийд ч гарч болно.
          </p>
        </header>

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
            <section id="tuhai" className="scroll-mt-8 rounded-2xl border border-[#e6e3da] bg-[#fffdf8] p-5 sm:p-6">
              <div className="mb-3 flex items-center gap-2.5">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#fff1c7] text-[#84530f]"><FileText className="h-4 w-4" /></span>
                <h2 className="text-base font-bold text-[#211f1a]">Nudleye гэж юу вэ?</h2>
              </div>
              <p className="text-sm leading-7 text-[#4a4d58]">
                Nudleye бол flashcard ашиглан үг, нэр томьёо болон төрөл бүрийн мэдлэгийг давтан сурахад зориулсан апп юм. Бид танд сурахад хэрэгтэй орчныг бүрдүүлнэ. Харин та бусдыг хүндэтгэж, аппыг зөв зориулалтаар ашиглана гэж найдаж байна.
              </p>
            </section>

            <section id="burtgel" className="scroll-mt-8 rounded-2xl border border-[#e6e3da] bg-[#fffdf8] p-5 sm:p-6">
              <div className="mb-3 flex items-center gap-2.5">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#fff1c7] text-[#84530f]"><UserCircle className="h-4 w-4" /></span>
                <h2 className="text-base font-bold text-[#211f1a]">Бүртгэл</h2>
              </div>
              <p className="text-sm leading-7 text-[#4a4d58]">
                Бүртгэл үүсгэхдээ үнэн зөв мэдээлэл ашиглаж, нууц үгээ өөрөө хамгаална уу. Таны бүртгэлээр хийгдсэн үйлдлийг таны хийсэн гэж үзнэ.
              </p>
            </section>

            <section id="bagts" className="scroll-mt-8 rounded-2xl border border-[#e6e3da] bg-[#fffdf8] p-5 sm:p-6">
              <div className="mb-3 flex items-center gap-2.5">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#fff1c7] text-[#84530f]"><Layers3 className="h-4 w-4" /></span>
                <h2 className="text-base font-bold text-[#211f1a]">Таны үүсгэсэн багцууд</h2>
              </div>
              <p className="text-sm leading-7 text-[#4a4d58]">
                Таны үүсгэсэн бүх багц, картын өмчлөх эрх танд хэвээр үлдэнэ. Хэрэв багцаа <strong>&ldquo;Бусдад нээлттэй&rdquo;</strong> болгосон бол бусад хэрэглэгч түүнийг үзэж, өөрийн сандаа хуулж ашиглах боломжтой. Харин хувийн багцыг зөвхөн та өөрөө ашиглана.
              </p>
            </section>

            <section id="horigloh" className="scroll-mt-8 rounded-2xl border border-[#f3ddd8] bg-[#fdf6f4] p-5 sm:p-6">
              <div className="mb-3 flex items-center gap-2.5">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#fbe2dd] text-[#b84d4d]"><Ban className="h-4 w-4" /></span>
                <h2 className="text-base font-bold text-[#211f1a]">Дараах үйлдлийг хийхгүй байхыг хүсье</h2>
              </div>
              <ul className="space-y-2">
                {[
                  "Бусдыг доромжилсон эсвэл хууль бус агуулга нийтлэх",
                  "Спам, автомат бот эсвэл системийн хэвийн ажиллагаанд саад учруулах",
                  "Бусдын бүртгэлд зөвшөөрөлгүй нэвтрэхийг оролдох",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm leading-6 text-[#4a4d58]">
                    <Ban className="mt-0.5 h-4 w-4 shrink-0 text-[#b84d4d]" />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-3 border-t border-[#f3ddd8] pt-3 text-sm leading-7 text-[#4a4d58]">Ийм тохиолдолд бид бүртгэлийг түр хаах эсвэл бүрмөсөн устгах эрхтэй.</p>
            </section>

            <section id="uilchilgee" className="scroll-mt-8 rounded-2xl border border-[#e6e3da] bg-[#fffdf8] p-5 sm:p-6">
              <div className="mb-3 flex items-center gap-2.5">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#fff1c7] text-[#84530f]"><ShieldAlert className="h-4 w-4" /></span>
                <h2 className="text-base font-bold text-[#211f1a]">Үйлчилгээний тухай</h2>
              </div>
              <p className="text-sm leading-7 text-[#4a4d58]">
                Бид аппыг найдвартай ажиллуулахын төлөө байнга ажилладаг. Гэсэн ч зарим үед засвар үйлчилгээ, шинэчлэл эсвэл техникийн асуудлаас шалтгаалан үйлчилгээ түр доголдох боломжтой.
              </p>
            </section>

            <section id="haah" className="scroll-mt-8 rounded-2xl border border-[#e6e3da] bg-[#fffdf8] p-5 sm:p-6">
              <div className="mb-3 flex items-center gap-2.5">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#fff1c7] text-[#84530f]"><LogOut className="h-4 w-4" /></span>
                <h2 className="text-base font-bold text-[#211f1a]">Бүртгэлээ хаах</h2>
              </div>
              <p className="text-sm leading-7 text-[#4a4d58]">
                Хэрэв цаашид ашиглахгүй гэж шийдвэл <Link href="/profile" className="font-semibold text-[#84530f] underline underline-offset-2">Профайл</Link> хэсгээс бүртгэлээ хүссэн үедээ бүрмөсөн устгаж болно.
              </p>
            </section>

            <section id="shinechlel" className="scroll-mt-8 rounded-2xl border border-[#e6e3da] bg-[#fffdf8] p-5 sm:p-6">
              <div className="mb-3 flex items-center gap-2.5">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#fff1c7] text-[#84530f]"><RefreshCw className="h-4 w-4" /></span>
                <h2 className="text-base font-bold text-[#211f1a]">Нөхцөл шинэчлэгдэх боломжтой</h2>
              </div>
              <p className="text-sm leading-7 text-[#4a4d58]">
                Апп хөгжихийн хэрээр энэ нөхцөл шинэчлэгдэж болно. Өөрчлөлт орсон тохиолдолд энэ хуудсан дээр шинэчилсэн огноог тэмдэглэнэ.
              </p>
            </section>

            <section id="holboo" className="scroll-mt-8 rounded-2xl border border-[#e6e3da] bg-[#fffdf8] p-5 sm:p-6">
              <div className="mb-3 flex items-center gap-2.5">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#fff1c7] text-[#84530f]"><Mail className="h-4 w-4" /></span>
                <h2 className="text-base font-bold text-[#211f1a]">Холбоо барих</h2>
              </div>
              <p className="text-sm leading-7 text-[#4a4d58]">Асуулт байвал бүртгэлтэй и-мэйл хаягаараа бидэнтэй холбогдоорой.</p>
            </section>
          </div>
        </div>

        <p className="mt-10 text-xs text-[#9a9da7]">
          Сүүлд шинэчилсэн: 2026 оны 7-р сар · Мөн манай <Link href="/privacy" className="underline underline-offset-2">Нууцлалын бодлого</Link>-той танилцана уу.
        </p>
      </main>
    </div>
  );
}
