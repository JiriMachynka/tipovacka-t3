import {
  ListItem,
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { cn } from "@/lib/utils";
import { useAuth, SignInButton, SignOutButton } from "@clerk/nextjs"
import { LogOut, X } from "lucide-react";
import Link from "next/link"
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { api } from "~/utils/api";
import { getPageName } from "~/utils/functions";

const SingleTournamentNavigation = () => {
  const [currentPageTitle, setCurrentPageTitle] = useState<string | undefined>("");
  const [mobileNav, setMobileNav] = useState<boolean>(false);
  const router = useRouter();
  const user = useAuth();
  const { data: tournamentData } = api.tournament.getAllTournamentData.useQuery({ tournamentId: parseInt(router.query.id as string) });

  useEffect(() => {
    setCurrentPageTitle(router.pathname.split("/")[router.pathname.split("/").length - 1]);
  }, [router.pathname]);

  return (
    <>
      <NavigationMenu className={cn("lg:relative lg:flex lg:flex-row", {
        "hidden": !mobileNav,
        "absolute left-0 top-0 mt-10 w-full h-[100vh] flex flex-col bg-primary": mobileNav,
        "my-auto": !user.isSignedIn,
      })}>
        <NavigationMenuList className={cn("lg:left-0 lg:top-0 lg:flex-row lg:gap-0", {
          "flex-col gap-5": mobileNav
        })}>
          {user.isSignedIn &&
            <>
              <NavigationMenuItem className={cn("lg:block", {
                "hidden": !mobileNav,
                "block": mobileNav
              })}>
                <Link href="/" legacyBehavior passHref >
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  Zpět na tipovačky
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem className={cn("lg:block", {
                "hidden": !mobileNav,
                "block": mobileNav
              })}>
                <Link href={`/tournaments/${router.query.id as string}/`} legacyBehavior passHref >
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    Tabulka
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem className={cn("lg:block", {
                "hidden": !mobileNav,
                "block": mobileNav
              })}>
                <Link href={`/tournaments/${router.query.id as string}/my-tips`} legacyBehavior passHref>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    Moje tipy
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem className={cn("lg:block", {
                "hidden": !mobileNav,
                "block": mobileNav
              })}>
                <Link href={`/tournaments/${router.query.id as string}/leaderboard`} legacyBehavior passHref>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    Žebříček
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              {(tournamentData?.authorId === user.userId) && (<>
                <NavigationMenuItem className={cn("hidden lg:inline-flex")}>
                  <NavigationMenuTrigger>Admin sekce</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="flex flex-col w-[300px] bg-primary">
                      <ListItem className="border-b border-b-slate-50 !rounded-none" href={`/tournaments/${router.query.id as string}/manage-matches`} title="Spravovat zápasy" />
                      <ListItem className="border-b border-b-slate-50 !rounded-none" href={`/tournaments/${router.query.id as string}/manage-scorers`} title="Spravovat střelce" />
                      <ListItem className="!rounded-none" href={`/tournaments/${router.query.id as string}/manage-players`} title="Spravovat hráče" />
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </>)}
            </>
          }
          <NavigationMenuItem className={cn("lg:hidden", {
            "hidden": !mobileNav,
            "block": mobileNav
          })}>
            <Link href={`/tournaments/${router.query.id as string}/manage-matches`} legacyBehavior passHref >
              <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                Spravovat zápasy
              </NavigationMenuLink>
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem className={cn("lg:hidden", {
            "hidden": !mobileNav,
            "block": mobileNav
          })}>
            <Link href={`/tournaments/${router.query.id as string}/manage-scorers`} legacyBehavior passHref >
              <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                Spravovat střelce
              </NavigationMenuLink>
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem className={cn("lg:hidden", {
            "hidden": !mobileNav,
            "block": mobileNav
          })}>
            <Link href={`/tournaments/${router.query.id as string}/manage-players`} legacyBehavior passHref >
              <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                Spravovat hráče
              </NavigationMenuLink>
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem className={cn("lg:block", {
            "hidden": !mobileNav,
            "block": mobileNav
          })}>
            <NavigationMenuLink className={cn(navigationMenuTriggerStyle(), "cursor-pointer", {
              "py-10": !user.isSignedIn,
            })}>
              {user.isSignedIn ? 
                <SignOutButton>
                  <button onClick={() => void router.push("/")}>
                    <span className="block lg:hidden">Odhlásit se</span>
                    <LogOut className="hidden lg:block" />
                  </button>
                </SignOutButton> 
                : 
                <SignInButton>
                  <button className="text-5xl uppercase">Přihlásit se</button>
                </SignInButton>
              }
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
      <div className={cn("items-center w-full", {
        "grid grid-cols-[1fr_40px]": !mobileNav,
        "flex": mobileNav
      })}>
        <h2 className={cn("text-3xl text-center font-semibold uppercase lg:hidden", {
          "block": !mobileNav,
          "hidden": mobileNav
        })}>{getPageName(currentPageTitle)}</h2>
        <button type="button" className={cn(`z-50 p-2 text-slate-50 rounded-lg lg:hidden hover:bg-slate-50 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-gray-200 ${mobileNav ? "ml-auto" : ""}`)} aria-controls="mobile-menu" aria-expanded="false" onClick={() => setMobileNav(!mobileNav)}>
          {mobileNav ? 
            <X /> :
            <svg className="w-6 h-6" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"></path>
            </svg>
          }
        </button>
      </div>
    </>
  )
}

export default SingleTournamentNavigation;