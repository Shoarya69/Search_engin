import { validateClientEnv } from "./config/env";
import { AppShell } from "./components/AppShell";
import { EnvError } from "./components/EnvError";
import { SearchExperience } from "./components/SearchExperience";

function App() {
  const validation = validateClientEnv();

  if (!validation.ok) {
    return <EnvError missing={validation.missing} />;
  }

  return (
    <AppShell>
      <SearchExperience env={validation.env} />
    </AppShell>
  );
}

export default App;
