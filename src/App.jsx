import { useEffect, useState } from "react";
import { IdentityProvider, useIdentity } from "./context/IdentityContext";
import { ensureSignedIn } from "./firebase/config";
import EntryGate from "./components/EntryGate";
import ChatRoom from "./components/ChatRoom";
import LoadingState from "./components/LoadingState";
import ErrorBanner from "./components/ErrorBanner";

function AppShell() {
  const { identity, roomId } = useIdentity();
  const [authState, setAuthState] = useState("connecting"); // connecting | ready | error
  const [authError, setAuthError] = useState(null);

  const connect = () => {
    setAuthState("connecting");
    ensureSignedIn()
      .then(() => setAuthState("ready"))
      .catch((err) => {
        console.error("Firebase auth failed:", err);
        setAuthError(err.message || "Couldn't reach Firebase.");
        setAuthState("error");
      });
  };

  useEffect(() => {
    connect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (authState === "connecting") {
    return <LoadingState label="Connecting to Duo…" />;
  }

  if (authState === "error") {
    return (
      <div className="app-min-height bg-background flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <ErrorBanner message={authError} onRetry={connect} />
        </div>
      </div>
    );
  }

  return identity && roomId ? <ChatRoom /> : <EntryGate />;
}

export default function App() {
  return (
    <IdentityProvider>
      <AppShell />
    </IdentityProvider>
  );
}
