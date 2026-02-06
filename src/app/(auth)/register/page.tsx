import Background from "@/ui/background";
import ThemeSwitcher from "@/ui/components/theme-switcher";
import Logo from "@/ui/forms/logo";
import RegisterForm from "@/ui/forms/register";
import Link from "next/link";

export default async function Page() {
  return (
    <div className="relative py-10 h-screen flex flex-col">
      <div className="px-4 sm:px-6 lg:px-8">
        <ThemeSwitcher className="ml-auto -mt-6 mb-6 sm:mb-4 sm:-mt-4 lg:my-0" />
        <div className="py-10 lg:py-20">
          <div className="mx-auto w-full max-w-100 lg:p-8">
            <Logo />
            <h1 className="mt-20 w-fit text-3xl font-medium text-gray-900 dark:text-zinc-100">
              Registration
            </h1>
            <p className="mt-2 text-gray-900 dark:text-white">
              Already have an account?&nbsp;
              <Link
                href="/login"
                className="font-medium underline bg-clip-text text-white/50 dark:text-black/50 bg-[linear-gradient(87.89deg,#944C16_0%,#0D0D0F_40.75%)] dark:bg-[linear-gradient(83.78deg,#944C16_-27.94%,#FFFFFF_70.52%)]"
                prefetch={false}
                style={{
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Sign in
              </Link>
            </p>

            <RegisterForm />
          </div>
        </div>
      </div>
      <div className="absolute z-10 bottom-0 left-0 hidden xl:block dark:mix-blend-normal mix-blend-difference">
        <Background />
      </div>
      <div className="text-center mt-auto text-sm text-gray-900 dark:text-zinc-100">
        &copy; {new Date().getFullYear()} Oblivio App
      </div>
    </div>
  );
}
