import { RELEASE_SHA } from "./release";

export default function ReleaseBadge() {
  return (
    <footer className="release-badge">
      <small>Lab 5: automated deployment · Release <code title={RELEASE_SHA}>{RELEASE_SHA.slice(0, 12)}</code></small>
    </footer>
  );
}
