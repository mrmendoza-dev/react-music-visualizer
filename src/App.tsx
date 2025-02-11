import { ApplicationShell } from "@/components/layout/ApplicationShell";
import { Providers } from "@/contexts/Providers";

function App() {
  return (
    <div className="App h-screen w-screen">
      <Providers>
        <ApplicationShell />
      </Providers>
    </div>
  );
}

export default App;
