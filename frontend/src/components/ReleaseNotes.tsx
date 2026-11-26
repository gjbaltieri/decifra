import { APP_VERSION, CHANGELOG } from '../constants/changelog';

export function ReleaseNotes({ currentOnly = false }: { currentOnly?: boolean }) {
  const releases = currentOnly ? CHANGELOG.filter(({ version }) => version === APP_VERSION) : CHANGELOG;
  return releases.map(({ version, changes }) => (
    <section key={version} className="w-full rounded-xl border border-zinc-800 bg-[#18181b] p-4 text-left">
      <h3 className="text-sm font-semibold text-zinc-200">Novidades da versão {version}</h3>
      <ul className="mt-2 list-disc space-y-1 pl-4 text-xs leading-relaxed text-zinc-400 marker:text-[#3aa394]">
        {changes.map((change) => <li key={change}>{change}</li>)}
      </ul>
    </section>
  ));
}
