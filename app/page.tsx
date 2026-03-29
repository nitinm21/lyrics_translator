import { SearchShell } from "@/components/search/search-shell";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center px-4 py-10 sm:px-6 sm:py-14 md:py-20">
      <div className="page-shell page-shell-open room-panel w-full max-w-3xl rounded-[32px] px-5 py-8 sm:px-8 sm:py-12 md:px-12 md:py-14">
        <div className="mx-auto mb-8 h-px w-24 ambient-rule sm:mb-10" />
        <div className="mx-auto w-full max-w-2xl text-center">
          <h1 className="font-serif text-4xl font-normal tracking-[0.02em] text-primary sm:text-5xl md:text-7xl">
            Lyrics Translator
          </h1>
          <p className="mt-3 text-base text-secondary sm:mt-4 sm:text-lg md:text-xl">
            Understand what your favorite songs are really saying.
          </p>
          <div className="mt-8 sm:mt-10">
            <SearchShell />
          </div>
        </div>
      </div>
    </main>
  );
}
