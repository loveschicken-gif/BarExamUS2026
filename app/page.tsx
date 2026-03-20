import { CivProApp } from '@/components/civ-pro-app';
import { loadCivProContent } from '@/src/lib/content';

export default function Page() {
  const content = loadCivProContent();

  return <CivProApp content={content} />;
}
