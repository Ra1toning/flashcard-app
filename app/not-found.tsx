import Link from "next/link";
import BrandLogo from "@/components/ui/BrandLogo";

export default function NotFound() {
  return (
    <div className="app-shell app-content relative grid min-h-screen place-items-center overflow-hidden px-4 py-10">
      <div className="relative w-full max-w-md text-center">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2.5 font-semibold">
          <BrandLogo markClassName="h-9 w-9" />
        </Link>
        <div className="panel relative overflow-hidden p-8">
          <div className="eyebrow mb-3">АЛДАА 404</div>
          <h1 className="text-5xl font-semibold tracking-tight">404</h1>
          <p className="mt-3 text-sm text-slate-500">
            Хайсан хуудас олдсонгүй. Холбоос буруу эсвэл устсан байж магадгүй.
          </p>
          <Link href="/" className="btn-primary mt-6 inline-flex justify-center px-5 py-3">
            Нүүр хуудас руу буцах
          </Link>
        </div>
      </div>
    </div>
  );
}
