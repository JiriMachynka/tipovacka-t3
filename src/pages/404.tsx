import { navigationMenuTriggerStyle } from "@/components/ui/navigation-menu";
import Link from "next/link";

const Custom404 = () => {
  return (
    <div className="w-full h-[100vh] bg-primary flex flex-col justify-center gap-5 text-slate-50 text-2xl">
      <p className="text-center text-4xl font-bold">Chyba 404</p>
      <Link href="/" className={`mx-auto p-4 ${navigationMenuTriggerStyle()}`}>
        Zpět na tipovačky
      </Link>
    </div>
  )
}
export default Custom404;