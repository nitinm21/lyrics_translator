import { SearchShell } from "@/components/search/search-shell";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center px-4 pt-16 pb-12 sm:px-6 sm:pt-24 sm:pb-16 md:pt-40">
      <div className="w-full max-w-2xl text-center">
        <h1 className="font-serif text-4xl font-normal tracking-[0.02em] text-primary sm:text-5xl md:text-7xl">
          Lyrics Translator
        </h1>
        <p className="mt-3 text-base text-secondary sm:mt-4 sm:text-lg md:text-xl">
          Search for a song. Read the lyrics. Understand every word.
        </p>
        <div className="mt-8 sm:mt-10">
          <SearchShell />
        </div>
      </div>
    </main>
  );
}
